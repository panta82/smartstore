const libUtil = require('util');
const libFs = require('fs');

const errno = require('enumconsts').errno;

const { safeFuncProp } = require('./tools');
const { OptionError, SmartStoreError, NotOpenError } = require('./errors');
const protocol = require('./protocol');

function SmartStoreOptions(source) {
	if (libUtil.isString(source)) {
		source = {
			path: source,
		};
	}

	/**
	 * Path on hdd where to save the file. Mandatory.
	 * @type {string}
	 */
	this.path = '';

	/**
	 * Logger function, used for debugging. Should take one argument.
	 */
	this.log = null;

	/**
	 * Min and max timeout to wait between auto-flushes
	 * @type {number}
	 */
	this.auto_flush_delay = [50, 500];

	Object.assign(this, source);
}

function SmartStoreProxy(handler) {
	return new Proxy(this, handler);
}

/**
 * Create new instance of the SmartStore
 * @param {SmartStoreOptions} options
 */
function SmartStore(options) {
	const thisStore = this;

	options = new SmartStoreOptions(options);

	if (!options.path) {
		throw new OptionError('path');
	}

	const log = options.log;
	let _open = false;
	let _opening = null;
	let _flushing = null;
	let _closing = null;
	const _serializedByKey = {};
	let _touchedKeys = {};
	let _flushWait = null;

	const _publicMethods = /** @lends SmartStore.prototype */ {
		open,
		openSync,
		flush,
		flushSync,
		close,
		closeSync,
	};

	// Make it so we can create proxy with new
	const _ret = SmartStoreProxy.call(this, {
		get: (object, key) => {
			onKeyAccess(key);
			return object[key];
		},
		set: (object, key, value) => {
			onKeyAccess(key);
			object[key] = value;
			return true;
		},
		deleteProperty(object, key) {
			onKeyAccess(key);
			delete object[key];
			return true;
		},
	});

	for (let key in _publicMethods) {
		Object.defineProperty(thisStore, key, safeFuncProp(_publicMethods[key]));
	}

	function logError(err) {
		log && log(`ERROR: ${err}`);
	}

	/**
	 * Open store async. Must be called and resolved before using the store.
	 * @returns {Promise<SmartStore>}
	 */
	function open() {
		if (_open) {
			return Promise.resolve(thisStore);
		}

		if (_opening) {
			return _opening;
		}

		_opening = new Promise((resolve, reject) => {
			libFs.readFile(options.path, 'utf8', (err, data) => {
				_opening = null;

				if (err) {
					if (err.code !== errno.ENOENT) {
						logError(err);
						return reject(err);
					}

					// We got "file not found". Try to make sure we can in principle open the file at location

					return libFs.writeFile(options.path, '', 'utf8', err => {
						if (err) {
							logError(err);
							return reject(err);
						}

						log && log(`No store file found at ${options.path}. Starting fresh`);
						_open = true;
						return resolve(thisStore);
					});
				}

				try {
					const parsed = protocol.deserialize(data);
					Object.assign(thisStore, parsed);
				} catch (err) {
					logError(err);
					return reject(err);
				}

				_open = true;

				return resolve(thisStore);
			});
		});

		return _opening;
	}

	/**
	 * Open store sync. Must be done before using the store.
	 * @returns {SmartStore}
	 */
	function openSync() {
		if (_opening) {
			// The async load is in progress.
			throw new SmartStoreError(
				`Store is already loading async (call either load or loadSync, not both)`
			);
		}

		let data, error;
		try {
			data = libFs.readFileSync(options.path, 'utf8');
		} catch (err) {
			if (err.code !== errno.ENOENT) {
				logError(err);
				throw err;
			}

			// We got "file not found". Try to make sure we can in principle open the file at location
			try {
				libFs.writeFileSync(options.path, '', 'utf8');

				// We are good
				log && log(`No store file found at ${options.path}. Starting fresh`);
				_open = true;
				return thisStore;
			} catch (writeErr) {
				logError(writeErr);
				throw err;
			}
		}

		try {
			const parsed = protocol.deserialize(data);
			Object.assign(thisStore, parsed);
		} catch (err) {
			logError(err);
			throw err;
		}

		_open = true;

		return thisStore;
	}

	/**
	 * Flushes all pending changes to HDD immediately. Async.
	 * @returns {Promise<SmartStore>}
	 */
	function flush() {
		return doFlush(false);
	}

	/**
	 * Flushes all pending changes to HDD immediately. Synchronous.
	 * @returns {SmartStore}
	 */
	function flushSync() {
		return doFlush(true);
	}

	/**
	 * Perform flush in the background. This will be called internally.
	 */
	function backgroundFlush() {
		doFlush(false).catch(err => {
			if (log) {
				log(`SmartStore background flush has failed!`);
				log(String(err.stack || err));
			}
		});
	}

	/**
	 * Flushes and then immediately closes the store. Async.
	 * @returns {Promise<SmartStore>}
	 */
	function close() {
		if (_opening) {
			return _opening.then(close);
		}

		if (_closing) {
			return _closing;
		}

		_closing = flush().then(
			() => {
				log && log('Store closed');
				_open = false;
				_closing = null;
				return thisStore;
			},
			err => {
				logError(err);
				_closing = null;
				throw err;
			}
		);
		return _closing;
	}

	/**
	 * Flushes and then immediately closes the store. Sync.
	 * @returns {SmartStore}
	 */
	function closeSync() {
		if (_closing) {
			throw new SmartStoreError(
				`Store is already closing async (call either close or closeSync, not both)`
			);
		}

		if (_opening) {
			throw new SmartStoreError(
				`Store is currently being opened async (call either sync or async methods, not both)`
			);
		}

		flushSync();

		log && log('Store closed');
		_open = false;
		return thisStore;
	}

	function onKeyAccess(key) {
		if (_publicMethods[key]) {
			return;
		}
		if (!_open) {
			throw new NotOpenError(key);
		}
		_touchedKeys[key] = true;

		const now = new Date();
		if (
			_flushWait &&
			now - _flushWait.startedAt >= options.auto_flush_delay[1] - options.auto_flush_delay[0]
		) {
			// No more delays
			return;
		}

		// Start flush wait or reset the timer
		_flushWait = _flushWait || {
			startedAt: now,
		};
		clearTimeout(_flushWait.timeout);
		_flushWait.timeout = setTimeout(backgroundFlush, options.auto_flush_delay[0]);
	}

	function doFlush(sync = false) {
		if (_flushWait) {
			clearTimeout(_flushWait.timeout);
			_flushWait = null;
		}

		let dirtyKeys = null;
		for (let key in _touchedKeys) {
			if (!(key in thisStore)) {
				continue;
			}
			const newSerialized = protocol.serialize(thisStore[key]);
			const oldSerialized = _serializedByKey[key];
			if (oldSerialized === undefined || newSerialized !== oldSerialized) {
				dirtyKeys = dirtyKeys || [];
				dirtyKeys.push(key);
				_serializedByKey[key] = newSerialized;
			}
		}
		_touchedKeys = {};

		if (!dirtyKeys) {
			log && log(`Flush completed, no changes`);
			if (sync) {
				return thisStore;
			}
			return _flushing || Promise.resolve(thisStore);
		}

		log && log(`Found dirty keys: ${dirtyKeys.join(',')}. Initiating write`);

		const lines = [];
		for (let key in thisStore) {
			if (!thisStore.hasOwnProperty(key)) {
				continue;
			}
			const val = thisStore[key];
			if (typeof val === 'function') {
				continue;
			}

			if (!_serializedByKey[key]) {
				_serializedByKey[key] = protocol.serialize(val);
			}

			if (_serializedByKey[key] !== undefined) {
				lines.push(JSON.stringify(key) + ': ' + _serializedByKey[key]);
			}
		}

		// _serializedByKey should now have fully synced serialized value of each key
		const out = '{\n' + lines.join(',\n') + '\n}\n';

		if (sync) {
			libFs.writeFileSync(options.path, out, 'utf8');
			log && log(`${out.length} bytes written to ${options.path} (sync)`);
			return thisStore;
		}

		let promise = new Promise((resolve, reject) => {
			libFs.writeFile(options.path, out, 'utf8', err => {
				if (err) {
					logError(err);
					return reject(err);
				}

				log && log(`${out.length} bytes written to ${options.path} (async)`);
				return resolve(thisStore);
			});
		});

		if (_flushing) {
			_flushing = promise = Promise.all([_flushing, promise]);
		} else {
			_flushing = promise;
		}

		// Cleanup
		promise.then(
			() => {
				if (_flushing === promise) {
					_flushing = null;
				}
			},
			err => {
				if (_flushing === promise) {
					_flushing = null;
				}
				throw err;
			}
		);

		return _flushing;
	}

	return _ret;
}
libUtil.inherits(SmartStore, SmartStoreProxy);

/**
 * @param {SmartStoreOptions|object} options
 * @returns {Promise<SmartStore|object>}
 */
SmartStore.open = options => {
	const store = new SmartStore(options);
	return store.open();
};

/**
 * @param {SmartStoreOptions|object} options
 * @returns {SmartStore}
 */
SmartStore.openSync = options => {
	const store = new SmartStore(options);
	store.openSync();
	return store;
};

module.exports = {
	SmartStore,
	SmartStoreOptions,
};

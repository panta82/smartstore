const libUtil = require('util');
const libFs = require('fs');

const isString = require('lodash.isstring');

const {safeFuncProp} = require('./tools');

function SmartStoreOptions(source) {
	if (isString(source)) {
		source = {
			path: source
		};
	}

	/**
	 * Path on hdd where to save the file. Mandatory.
	 * @type {string}
	 */
	this.path = '';

	/**
	 * Logger function, used for debugging
	 */
	this.log = (message) => {};

	/**
	 * Min and max timeout to wait between write
	 * @type {number}
	 */
	this.flush_timeout_range = [50, 500];

	Object.assign(this, source);
}

function SmartStoreProxy(handler) {
	return new Proxy(this, handler);
}

function SmartStore(options) {
	const thisStore = this;

	options = new SmartStoreOptions(options);

	let _open = false;
	const _serializedKeys = {};
	let _dirtyKeys = {};
	let _wait = null;

	// Make it so we can create proxy with new
	const _ret = SmartStoreProxy.call(this, {
		set: (object, key, value) => {
			object[key] = value;
			_dirtyKeys[key] = true;
			triggerDirtyCheck();
		}
	});

	Object.defineProperties(this, /** @lends SmartStore.prototype */ {
		open: safeFuncProp(open),
		openSync: safeFuncProp(openSync),
		flush: safeFuncProp(flush),
		close: safeFuncProp(close)
	});

	function open() {
		if (_open) {
			return;
		}

		libFs.readFile()
	}

	function openSync() {

	}

	function flush() {

	}

	function close() {

	}

	function triggerDirtyCheck() {

	}

	return _ret;
}
libUtil.inherits(SmartStore, SmartStoreProxy);

/**
 * @param {SmartStoreOptions|object} options
 * @returns {SmartStore}
 */
SmartStore.open = (options) => {
	const result = new SmartStore(options);
	result.open();
	return result;
};

module.exports = {
	SmartStore,
	SmartStoreOptions
};
const {safeFuncProp} = require('./tools');

function SmartStoreOptions(source) {
	/**
	 * Logger function, used for debugging
	 */
	this.log = () => {};

	Object.assign(this, source);
}

function SmartStore(options) {
	options = new SmartStoreOptions(options);

	Object.defineProperties(this, /** @lends SmartStore.prototype */ {
		open: safeFuncProp(open),
		flush: safeFuncProp(flush),
		close: safeFuncProp(close)
	});

	function open() {

	}

	function flush() {

	}

	function close() {

	}
}

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
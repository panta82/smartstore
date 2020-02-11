const { SmartStore, SmartStoreOptions } = require('./lib/smart_store');
const {
	SmartStoreError,
	OptionError,
	ReservedPropertyError,
	NotOpenError,
} = require('./lib/errors');

module.exports = SmartStore;

module.exports.SmartStore = SmartStore;

module.exports.Options = SmartStoreOptions;

module.exports.Error = SmartStoreError;
module.exports.OptionError = OptionError;
module.exports.ReservedPropertyError = ReservedPropertyError;
module.exports.NotOpenError = NotOpenError;

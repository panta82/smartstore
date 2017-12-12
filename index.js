const {SmartStore, SmartStoreOptions} = require('./lib/smart_store');
const {SmartStoreError, OptionError, ReservedPropertyError, NotOpenError} = require('./lib/errors');

SmartStore.SmartStore = SmartStore;

SmartStore.Options = SmartStoreOptions;

SmartStore.Error = SmartStoreError;
SmartStore.OptionError = OptionError;
SmartStore.ReservedPropertyError = ReservedPropertyError;
SmartStore.NotOpenError = NotOpenError;

/** @type {SmartStore} */
module.exports = SmartStore;
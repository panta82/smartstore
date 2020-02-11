class SmartStoreError extends Error {
	constructor(message) {
		super(message);

		this.code = 500;
	}
}

class ReservedPropertyError extends SmartStoreError {
	constructor(name, value) {
		super(`Attempt to overwrite reserved property "${name}" of SmartStore with value: ${value}`);
	}
}

class OptionError extends SmartStoreError {
	constructor(optionName) {
		super(`Missing mandatory option "${optionName}"`);
	}
}

class NotOpenError extends SmartStoreError {
	constructor(key) {
		super(
			`Trying to access key "${String(
				key
			)}" on a smart store that is not open yet. Forgot to call open() or didn't wait for it to be done?`
		);
	}
}

class ProtocolError extends SmartStoreError {}

module.exports = {
	SmartStoreError,
	ReservedPropertyError,
	OptionError,
	NotOpenError,
	ProtocolError,
};

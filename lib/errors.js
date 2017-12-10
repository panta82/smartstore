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

module.exports = {
	SmartStoreError,
	ReservedPropertyError
};
const { ReservedPropertyError } = require('./errors');

function safeFuncProp(fn) {
	return {
		configurable: false,
		enumerable: false,
		get: () => fn,
		set: value => {
			throw new ReservedPropertyError(fn.name, value);
		},
	};
}

module.exports = {
	safeFuncProp,
};

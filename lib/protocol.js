const isString = require('util').isString;

const { ProtocolError } = require('./errors');

const HEADERS = {
	date: '|d|',
	regex: '|r|',
};

const HEADERS_REVERSE = {};
for (let key in HEADERS) {
	HEADERS_REVERSE[HEADERS[key]] = key;
}

function reviver(key, value) {
	if (!isString(value)) {
		return value;
	}

	const header = value.slice(0, 3);
	if (!HEADERS_REVERSE[header]) {
		return value;
	}

	if (value[3] === '|') {
		// This is an escaped string, not a valid header. De-escape.
		return header + value.slice(4);
	}

	if (header === HEADERS.date) {
		return new Date(Number(value.slice(4)));
	}

	if (header === HEADERS.regex) {
		const splitterIndex = value.indexOf('|', 4);
		const flags = value.slice(4, splitterIndex);
		const source = value.slice(splitterIndex + 1);
		return new RegExp(source, flags);
	}

	throw new ProtocolError(`Unsupported header: ${header}`);
}

function deserialize(str) {
	return JSON.parse(str, reviver);
}

function replacer(key, value) {
	const original = this[key];

	if (isString(original)) {
		const header = original.slice(0, 3);
		if (HEADERS_REVERSE[header]) {
			// Uh-oh. Someone is trying to serialize one of our headers. Escape it like this:
			// '|d| test' -> '|d|| test'
			// '|d||test' -> '|d|||test'
			return header + '|' + original.slice(3);
		}
	}

	if (original instanceof Date) {
		return `${HEADERS.date} ${original.valueOf()}`;
	}

	if (original instanceof RegExp) {
		return `${HEADERS.regex} ${original.flags}|${original.source}`;
	}

	// Fall back to default
	return value;
}

function serialize(value) {
	return JSON.stringify(value, replacer);
}

module.exports = {
	deserialize,
	serialize,
};

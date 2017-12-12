function reviver(key, value) {
	// TODO: Actual reviving
	return value;
}

function deserialize(str) {
	return JSON.parse(str, reviver);
}

function replacer(key, value) {
	// TODO: Actual replacing
	return value;
}

function serialize(value) {
	return JSON.stringify(value, replacer);
}

module.exports = {
	deserialize,
	serialize
};
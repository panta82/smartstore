const {SmartStore} = require('../lib/smart_store');

const store = SmartStore.open('/tmp/store.dat');

store.test = {
	a: 'a',
	b: new Date(),
	c: /abc/i
};

store.items = [];
store.items.push({
	a: {
		b: {
			c: 1
		}
	}
});

store.flush = 5;
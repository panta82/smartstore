const SmartStore = require('../index');

const s1 = new SmartStore('/tmp/test.store');
s1.openSync();

const store = SmartStore.openSync({
	path: '/tmp/store.dat',
	log: console.log,
});

store.test = {
	a: 'a',
	b: new Date(),
	c: /abc/i,
};

store.items = [];

setTimeout(() => {
	store.items.push({
		a: {
			b: {
				c: 1,
			},
		},
	});

	setTimeout(() => {
		store.flush = 5;
	}, 1000);
}, 1000);

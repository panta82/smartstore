const expect = require('chai').expect;

const {SmartStore} = require('../lib/smart_store');

describe('SmartStore', () => {
	describe('sync', () => {
		it('can work', () => {
			const store = SmartStore.openSync('/tmp/test.store');
			store.string = 'string';
			store.number = 5;
			store.null = null;
			store.undef = undefined;
			store.flushSync();
			store.closeSync();

			const store2 = SmartStore.openSync('/tmp/test.store');
			expect(store2.string).to.equal('string');
			expect(store2.number).to.equal(5);
			expect(store2.null).to.be.null;
			expect(store2.undef).to.be.undefined;
		});
	});

	describe('async', () => {
		it('can work', (done) => {
			SmartStore.open('/tmp/test.store')
				.then(store => {
					store.string = 'string';
					store.number = 5;
					store.null = null;
					store.undef = undefined;
					return store.flush();
				})
				.then(store => {
					return store.close();
				})
				.then(() => {
					return SmartStore.open('/tmp/test.store');
				})
				.then(store => {
					expect(store.string).to.equal('string');
					expect(store.number).to.equal(5);
					expect(store.null).to.be.null;
					expect(store.undef).to.be.undefined;

					done();
				});
		});
	});
});

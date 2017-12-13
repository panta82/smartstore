const expect = require('chai').expect;

const protocol = require('../lib/protocol');

describe('protocol', () => {
	it('can serialize dates', () => {
		const date = new Date();

		const str = protocol.serialize({
			date
		});

		const data = protocol.deserialize(str);

		expect(data.date).to.be.instanceof(Date);
		expect(data.date.toISOString()).to.equal(date.toISOString());
	});

	it('can serialize regexes', () => {
		const data = {
			r1: /abc/img,
			r2: /test|with|or/,
			r3: /|||||||||/i
		};

		const data2 = protocol.deserialize(protocol.serialize(data));

		expect(data2.r1.source).to.equal('abc');
		expect(data2.r1.flags).to.equal('gim');
		expect(data2.r2.source).to.equal('test|with|or');
		expect(data2.r2.flags).to.equal('');
		expect(data2.r3.source).to.equal('|||||||||');
		expect(data2.r3.flags).to.equal('i');
	});

	it('can escape tricky strings', () => {
		const data = {
			things: [
				'|d|', '|a|', ' d', '|r| i|abc', '|r|| i|abc', '|r| ||i|abc', '|r||| |i|abc'
			]
		};

		const data2 = protocol.deserialize(protocol.serialize(data));

		expect(data2.things).to.eql(data.things);
	});
});
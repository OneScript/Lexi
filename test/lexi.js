var assert = require('assert'),
	Lexi = require('../lib/lexi');

describe('#lexi', function() {
	it('should generate patterns', function() {
		assert.equal(new Lexi().addRule('foo').addRule('bar').getRegexp().source, '(foo)|(bar)');
		assert.equal(new Lexi().addRule('(foo)').getRegexp().source, '((foo))');
		assert.equal(new Lexi().addRule('\\((foo)').getRegexp().source, '(\\((foo))');
		assert.equal(new Lexi().addRule('(foo)(bar)').getRegexp().source, '((foo)(bar))');
	});

	it('should split subPatterns', function(done) {
		var error = setTimeout(function() {
			assert.ok(false, 'Callback was not called.');
			done();
		}, 500);

		new Lexi().addRule('([a-zA-Z]+) ([a-zA-Z]+)', function(name, surname) {
			assert.equal(name, 'John');
			assert.equal(surname, 'Doe');
			clearTimeout(error);
			done();
			return [1, 2];
		}).scan('John Doe');
	});

	it('should split nested subPatterns', function(done) {
		var error = setTimeout(function() {
			assert.ok(false, 'Callback was not called.');
			done();
		}, 500);

		new Lexi().addRule('(([0-9]{3})\\-[0-9]{4})', function(number, prefix) {
			assert.equal(number, '867-5309');
			assert.equal(prefix, '867');
			clearTimeout(error);
			done();
			return [1, 2];
		}).scan('867-5309');
	});

	it('should ignore rule', function() {
		assert.deepEqual(new Lexi().addRule('foobar', function() {
			return undefined;
		}).scan('foobar'), []);

		assert.deepEqual(new Lexi().addRule('(foo)(bar)', function() {
			return [undefined, undefined];
		}).scan('foobar'), []);
	});

	it('should return multiple types', function() {
		var expected = [
			{
				type: 'HOUSENUMBER',
				values: '742',
				offset: 0,
				line: 1
			},
			{
				type: 'STREET',
				values: 'Evergreen Terrace',
				offset: 3,
				line: 1
			}
		];

		var actual = new Lexi().addRule('([0-9]+) ([a-zA-Z ]+)', function(houseNumber, street) {
			return ['HOUSENUMBER', 'STREET'];
		}).scan('742 Evergreen Terrace');

		assert.equal(JSON.stringify(actual), JSON.stringify(expected));
	});
});
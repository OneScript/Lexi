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

		var lexemes = new Lexi().addRule('([0-9]+) ([a-zA-Z ]+)', function(houseNumber, street) {
			return ['HOUSENUMBER', 'STREET'];
		}).scan('742 Evergreen Terrace');

		assert.equal(JSON.stringify(lexemes), JSON.stringify(expected));
	});

	it('should scan input', function() {
		var expected = [
			{
				type: 'LINE',
				values: "Circles in the dark and it's dangerous to move\n",
				offset: 0,
				line: 1
			},
			{
				type: 'LINE',
				values: "I had my arm up and was pasted to the wall\n",
				offset: 47,
				line: 2
			},
			{
				type: 'LINE',
				values: "Another cool confusion that I don't get but that's fine\n",
				offset: 90,
				line: 3
			},
			{
				type: 'LINE',
				values: "Cause i was happy to go home and write a song\n",
				offset: 146,
				line: 4
			}
		];

		var lexemes = new Lexi().addRule("[^\\n]*\\n", function() {
			return 'LINE';
		}).scan(
			"Circles in the dark and it's dangerous to move\n" +
			"I had my arm up and was pasted to the wall\n" +
			"Another cool confusion that I don't get but that's fine\n" +
			"Cause i was happy to go home and write a song\n"
		);

		assert.equal(JSON.stringify(lexemes), JSON.stringify(expected));
	});
});
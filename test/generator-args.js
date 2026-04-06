const assert = require('assert');

const generatorArgs = require('../src/generator-args');

describe('generator args', () => {
	it('keeps an explicit variable name fixed', () => {
		const parsedArgs = generatorArgs.parseGeneratorArgs(['My heart', 'was', '123']);

		assert.strictEqual(parsedArgs.startProvided, true);
		assert.strictEqual(parsedArgs.variableNameProvided, true);
		assert.strictEqual(parsedArgs.assignmentProvided, true);
		assert.strictEqual(parsedArgs.variableName, 'my heart');
		assert.strictEqual(parsedArgs.start, 'my heart was');
		assert.strictEqual(parsedArgs.nextStart().start, 'my heart was');
	});

	it('keeps an explicit start phrase fixed', () => {
		const parsedArgs = generatorArgs.parseGeneratorArgs(['Midnight Rider is', '123']);

		assert.strictEqual(parsedArgs.startProvided, true);
		assert.strictEqual(parsedArgs.start, 'Midnight Rider is');
		assert.strictEqual(parsedArgs.nextStart().start, 'Midnight Rider is');
	});

	it('cycles fallback variable names before repeating', () => {
		const parsedArgs = generatorArgs.parseGeneratorArgs(['123']);
		const starts = [parsedArgs.start];
		const defaultVariableNames = generatorArgs.getDefaultVariableNames();

		for (let index = 1; index < defaultVariableNames.length; index++) {
			starts.push(parsedArgs.nextStart().start);
		}

		assert.strictEqual(parsedArgs.startProvided, false);
		assert.strictEqual(parsedArgs.variableNameProvided, false);
		assert.strictEqual(parsedArgs.assignmentProvided, false);
		assert.strictEqual(new Set(starts).size, starts.length);
	});

	it('adds theme-specific proper names to fallback starts', () => {
		const defaultMetalVariables = generatorArgs.getDefaultVariableNames(['metal']);

		assert.ok(defaultMetalVariables.includes('Iron Reaper'));
		assert.ok(defaultMetalVariables.includes('Onyx Viper'));
		assert.ok(defaultMetalVariables.includes('my heart'));
	});

	it('defaults to a 2-7 digit number', () => {
		const parsedArgs = generatorArgs.parseGeneratorArgs([]);

		assert.strictEqual(parsedArgs.numberProvided, false);
		assert.match(parsedArgs.number, /^[1-9][0-9]+$/);
		assert.ok(parsedArgs.number.length >= 2);
		assert.ok(parsedArgs.number.length <= 7);
	});

	it('marks an explicit number as provided', () => {
		const parsedArgs = generatorArgs.parseGeneratorArgs(['12345']);

		assert.strictEqual(parsedArgs.numberProvided, true);
		assert.strictEqual(parsedArgs.number, '12345');
	});

	it('defaults automatic assignments to singular-friendly verbs', () => {
		const parsedArgs = generatorArgs.parseGeneratorArgs([]);

		assert.ok(['is', 'was'].includes(parsedArgs.assignment));
		assert.ok(['is', 'was'].includes(parsedArgs.nextStart().assignment));
	});

	it('preserves explicit plural-style assignments', () => {
		const parsedArgs = generatorArgs.parseGeneratorArgs(['Billie Jean', 'are', '123']);

		assert.strictEqual(parsedArgs.assignment, 'are');
		assert.strictEqual(parsedArgs.nextStart().assignment, 'are');
	});

	it('parses a named theme argument', () => {
		const parsedArgs = generatorArgs.parseGeneratorArgs(['Theme:glam,metal', '123']);

		assert.strictEqual(parsedArgs.theme, 'glam,metal');
	});
});
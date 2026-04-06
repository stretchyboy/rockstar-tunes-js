const assert = require('assert');

const rockLexicon = require('../src/rock-lexicon');

describe('rock lexicon', () => {
	it('provides rock-flavored words by exact character length', () => {
		const sixLetterWords = rockLexicon.getRockWordsByLength(6).map(function(entry) {
			return entry.word;
		});

		assert.ok(sixLetterWords.includes('shadow'));
		assert.ok(sixLetterWords.includes('velvet'));
	});

	it('returns cloned entries so callers can annotate results safely', () => {
		const entries = rockLexicon.getRockWordsByLength(8);

		entries[0].word = 'changed';
		assert.notStrictEqual(rockLexicon.getRockWordsByLength(8)[0].word, 'changed');
	});

	it('adds theme-specific words when a preset is selected', () => {
		const glamEntries = rockLexicon.getRockWordsByLength(7, ['glam']);
		const glamWords = glamEntries.map(function(entry) {
			return entry.word;
		});

		assert.ok(glamWords.includes('glitter'));
		assert.ok(glamWords.includes('stardust'));
		assert.ok(glamEntries.some(function(entry) {
			return entry.word === 'glitter' && entry.sourceTheme === 'glam';
		}));
	});

	it('broadens theme presets across short and long exact lengths', () => {
		const bluesFour = rockLexicon.getRockWordsByLength(4, ['blues']).map(function(entry) {
			return entry.word;
		});
		const metalNine = rockLexicon.getRockWordsByLength(9, ['metal']).map(function(entry) {
			return entry.word;
		});

		assert.ok(bluesFour.includes('mojo'));
		assert.ok(bluesFour.includes('juke'));
		assert.ok(metalNine.includes('battleaxe'));
		assert.ok(metalNine.includes('blackened'));
	});

	it('keeps a substantially larger local pool for themed runs', () => {
		const baseCount = rockLexicon.getRockLexicon().length;
		const glamCount = rockLexicon.getRockLexicon(['glam']).length;
		const metalCount = rockLexicon.getRockLexicon(['metal']).length;
		const bluesCount = rockLexicon.getRockLexicon(['blues']).length;
		const heartlandCount = rockLexicon.getRockLexicon(['heartland']).length;

		assert.ok(baseCount >= 90);
		assert.ok(glamCount >= baseCount + 20);
		assert.ok(metalCount >= baseCount + 20);
		assert.ok(bluesCount >= baseCount + 35);
		assert.ok(heartlandCount >= baseCount + 35);
	});

	it('deepens blues and heartland with more distinctive vocabulary', () => {
		const bluesWords = rockLexicon.getRockLexicon(['blues']).map(function(entry) {
			return entry.word;
		});
		const heartlandWords = rockLexicon.getRockLexicon(['heartland']).map(function(entry) {
			return entry.word;
		});

		assert.ok(bluesWords.includes('cornwhiskey'));
		assert.ok(bluesWords.includes('hardluck'));
		assert.ok(bluesWords.includes('catfish'));
		assert.ok(heartlandWords.includes('smalltown'));
		assert.ok(heartlandWords.includes('harvestmoon'));
		assert.ok(heartlandWords.includes('countyline'));
	});

	it('lists available theme names', () => {
		assert.deepStrictEqual(rockLexicon.getThemeNames(), ['blues', 'glam', 'heartland', 'metal', 'psychedelic']);
	});
});
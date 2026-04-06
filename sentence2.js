// is, or the aliases was or were
//Common variables consist of one of the keywords a, an, the, my or your

const https = require('https');
const words = require('cmu-pronouncing-dictionary')
const generatorArgs = require('./src/generator-args');
const rockLexicon = require('./src/rock-lexicon');

const START_VARIANT_COUNT = 5;
const MAX_RUNTIME_MS = 20000;
const REQUEST_TIMEOUT_MS = 1500;
const MAX_RESULTS_PER_START = 5;
const DISPLAY_RESULTS_PER_START = 3;
const MAX_TOTAL_RESULTS = 20;
const MIN_OUTPUT_SYLLABLES = 10;
const THEME_SCORE_BOOST = 50000;
const THEME_PROFILES = {
  blues: {
    tagBoosts: {
      start: { adj: 2500, n: 2000, v: 1000 },
      middle: { n: 2500, v: 2000, adj: 1000 },
      end: { n: 3500, adj: 1500 }
    },
    sourceThemeWordBoost: 1500,
    compoundBoost: 1000,
    syllablePatternBoosts: { 1: 500, 2: 1200, 3: 700 },
    endingWords: {
      moonshine: 3500,
      crossroad: 3200,
      hardluck: 3000,
      graveyard: 2600,
      riverbend: 2600,
      moonriver: 2500,
      lowdown: 2400,
      sorrow: 2200
    }
  },
  heartland: {
    tagBoosts: {
      start: { n: 2500, adj: 1500 },
      middle: { n: 3500, adj: 1000 },
      end: { n: 4500 }
    },
    sourceThemeWordBoost: 1800,
    compoundBoost: 1800,
    syllablePatternBoosts: { 1: 300, 2: 1500, 3: 900 },
    endingWords: {
      smalltown: 3200,
      countyline: 3200,
      harvestmoon: 3000,
      workboots: 2800,
      dirtroad: 2800,
      hometown: 2600,
      frontporch: 2500,
      backroad: 2400
    }
  },
  glam: {
    tagBoosts: {
      start: { adj: 3000, n: 2200, v: 1200 },
      middle: { n: 2200, adj: 2400, v: 1000 },
      end: { n: 3200, adj: 1800 }
    },
    sourceThemeWordBoost: 1700,
    compoundBoost: 1500,
    syllablePatternBoosts: { 1: 900, 2: 1300, 3: 1400, 4: 1800 },
    endingWords: {
      spotlight: 3400,
      mirrorball: 3400,
      champagne: 3200,
      stardust: 3000,
      glitterati: 3000,
      glamour: 2800,
      sugarflash: 2600,
      showgirl: 2400
    }
  },
  metal: {
    tagBoosts: {
      start: { n: 2800, adj: 1400, v: 2200 },
      middle: { n: 3000, v: 2200, adj: 1200 },
      end: { n: 3800, adj: 2200 }
    },
    sourceThemeWordBoost: 1700,
    compoundBoost: 2000,
    syllablePatternBoosts: { 1: 700, 2: 1500, 3: 1600, 4: 1100 },
    endingWords: {
      battleaxe: 3600,
      skullfire: 3400,
      doomrider: 3300,
      bonegrinder: 3300,
      blackened: 3200,
      shockwave: 3000,
      warcry: 2800,
      hellfire: 2700
    }
  }
};
const STOP_WORDS = {
  a: true,
  also: true,
  almost: true,
  an: true,
  and: true,
  are: true,
  at: true,
  both: true,
  by: true,
  each: true,
  for: true,
  from: true,
  have: true,
  here: true,
  into: true,
  less: true,
  little: true,
  make: true,
  more: true,
  must: true,
  on: true,
  of: true,
  only: true,
  or: true,
  over: true,
  really: true,
  said: true,
  some: true,
  that: true,
  the: true,
  their: true,
  them: true,
  themselves: true,
  then: true,
  they: true,
  this: true,
  those: true,
  to: true,
  through: true,
  time: true,
  too: true,
  under: true,
  were: true,
  what: true,
  when: true,
  which: true,
  with: true
};
const BORING_WORDS = {
  analysis: true,
  called: true,
  coming: true,
  degree: true,
  brought: true,
  changed: true,
  described: true,
  established: true,
  government: true,
  husband: true,
  leclercq: true,
  nothing: true,
  persons: true,
  presence: true,
  process: true,
  requirements: true,
  thesis: true,
  throughout: true
};
const PREFERRED_TAGS = {
  adj: true,
  adv: true,
  n: true,
  prop: true,
  v: true
};

function parseThemes(rawThemeValue) {
  if (!rawThemeValue) {
    return [];
  }

  return String(rawThemeValue).split(',').map(function(theme) {
    return theme.trim().toLowerCase();
  }).filter(Boolean);
}

function getActiveThemeProfiles(themeNames) {
  return themeNames.map(function(theme) {
    return THEME_PROFILES[theme];
  }).filter(Boolean);
}


function stressNum(word) {
  var lowerWord = word.toLowerCase(word)
  var out = "?"
  var pronunciation = words[lowerWord]

  if (pronunciation) {
    out = pronunciation.replace(/[^0-2]/g, "")
  }

  return out
}

function isExpired(deadline) {
  return Date.now() >= deadline;
}

function datamuseWords(query, deadline) {
  return new Promise((resolve, reject) => {
    var remaining = deadline - Date.now();
    var search = new URLSearchParams(query);
    var request;

    if (remaining <= 0) {
      reject(new Error('Timed out fetching words'));
      return;
    }

    request = https.get("https://api.datamuse.com/words?" + search.toString(), (response) => {
      var body = "";

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);

    request.setTimeout(Math.min(remaining, REQUEST_TIMEOUT_MS), () => {
      request.destroy(new Error('Datamuse request timed out'));
    });
  });
}

function choice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  var shuffled = items.slice();

  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  return shuffled;
}

function getSeedWords(topics, fallbackWord) {
  var seen = {};
  var candidates = topics.split(/\s+/).map(function(word) {
    return word.toLowerCase().replace(/^\W+|\W+$/g, '');
  }).filter(function(word) {
    return word.length > 0 && word.indexOf('-') === -1;
  });

  candidates.push(fallbackWord.toLowerCase());

  return candidates.filter(function(word) {
    if (seen[word]) {
      return false;
    }

    seen[word] = true;
    return true;
  });
}

function prioritizeCandidates(possibles) {
  var topCount = Math.min(possibles.length, Math.max(5, Math.ceil(possibles.length / 3)));
  var topChoices = shuffle(possibles.slice(0, topCount));
  var remainder = shuffle(possibles.slice(topCount));

  return topChoices.concat(remainder);
}

function hasPreferredTag(item) {
  return (item.tags || []).some(function(tag) {
    return PREFERRED_TAGS[tag] === true;
  });
}

function isUsefulWord(item, iPos, sNumberLength) {
  var lowerWord = item.word.toLowerCase();
  var middleSlot = iPos > 0 && iPos < sNumberLength - 1;

  if (STOP_WORDS[lowerWord]) {
    return false;
  }

  if (BORING_WORDS[lowerWord]) {
    return false;
  }

  if (middleSlot && !hasPreferredTag(item)) {
    return false;
  }

  return true;
}

function scoreCandidate(item, iPos, sNumberLength) {
  var score = item.f || 0;
  var lowerWord = item.word.toLowerCase();

  if (hasPreferredTag(item)) {
    score += 100000;
  }

  if (item.numSyllables >= 2) {
    score += 5000;
  }

  if (iPos === sNumberLength - 1 && item.numSyllables >= 2) {
    score += 2000;
  }

  if (themes.length !== 0 && item.sourceTheme && themes.indexOf(item.sourceTheme) !== -1) {
    score += THEME_SCORE_BOOST;
  }

  if (BORING_WORDS[lowerWord]) {
    score -= 200000;
  }

  return score;
}

function getWordSlot(index, total) {
  if (index === 0) {
    return 'start';
  }

  if (index === total - 1) {
    return 'end';
  }

  return 'middle';
}

function getPrimaryTag(item) {
  return item && item.tags && item.tags.length !== 0 ? item.tags[0] : null;
}

function scoreThemeWord(item, profile, index, total) {
  var score = 0;
  var slot = getWordSlot(index, total);
  var tag = getPrimaryTag(item);
  var lowerWord = item.word.toLowerCase();

  if (profile.tagBoosts[slot] && tag && profile.tagBoosts[slot][tag]) {
    score += profile.tagBoosts[slot][tag];
  }

  if (profile.sourceThemeWordBoost && item.sourceTheme) {
    score += profile.sourceThemeWordBoost;
  }

  if (profile.compoundBoost && item.word.length >= 8) {
    score += profile.compoundBoost;
  }

  if (profile.syllablePatternBoosts[item.numSyllables]) {
    score += profile.syllablePatternBoosts[item.numSyllables];
  }

  if (profile.endingWords[lowerWord]) {
    score += profile.endingWords[lowerWord];
  }

  return score;
}

function scoreSentenceResult(result) {
  var profiles = getActiveThemeProfiles(themes);
  var score = result.syllables;

  if (profiles.length === 0 || !result.words || result.words.length === 0) {
    return score;
  }

  result.words.forEach(function(item, index) {
    profiles.forEach(function(profile) {
      score += scoreThemeWord(item, profile, index, result.words.length);
    });
  });

  return score;
}

function getBodyWords(sentence, start) {
  return sentence.slice(start.length).trim().split(/\s+/).map(function(word) {
    return word.toLowerCase().replace(/^\W+|\W+$/g, '');
  }).filter(Boolean);
}

function getSentenceSignature(sentence, start) {
  return getBodyWords(sentence, start).slice(0, 3).join(' ');
}

function getSentenceTailSignature(sentence, start) {
  return getBodyWords(sentence, start).slice(-2).join(' ');
}

function getMinimumSyllables(maxSyllables) {
  return Math.min(maxSyllables, Math.max(MIN_OUTPUT_SYLLABLES, maxSyllables - 6));
}

function buildDatamuseQueries(sTopics, sLastWord, iTarget, iPos) {
  var baseQuery = {
    sp: "?".repeat(iTarget),
    md: "srpf",
    topics: sTopics
  };

  if (iPos !== 0) {
    return [Object.assign({}, baseQuery, { rel_bga: sLastWord })];
  }

  var queries = [];
  var seedWords = shuffle(getSeedWords(sTopics, sLastWord));
  var seedModes = shuffle(['rel_bga', 'rel_trg']);

  seedWords.forEach(function(seedWord) {
    seedModes.forEach(function(seedMode) {
      var query = Object.assign({}, baseQuery);
      query[seedMode] = seedWord;
      queries.push(query);
    });
  });

  queries.push(Object.assign({}, baseQuery, { rel_bga: sLastWord }));

  return queries;
}

function filterCandidates(items, iTarget, maxCount, iPos, sNumberLength) {
  return items.map(moveTags).filter(function(item) {
    if (!item.word || item.word.indexOf('-') !== -1) {
      return false;
    }

    if (item.word.length !== iTarget) {
      return false;
    }

    if (item.word.replace(/\W/g, "").length === 0) {
      return false;
    }

    return isUsefulWord(item, iPos, sNumberLength);
  }).sort(function(a, b) {
    return scoreCandidate(b, iPos, sNumberLength) - scoreCandidate(a, iPos, sNumberLength);
  }).slice(0, maxCount);
}

function getLocalCandidates(iTarget, maxCount, iPos, sNumberLength) {
  return filterCandidates(rockLexicon.getRockWordsByLength(iTarget, themes), iTarget, maxCount, iPos, sNumberLength);
}

async function getCandidates(sTopics, sLastWord, iTarget, iPos, sNumberLength, deadline) {
  var maxCount = Math.max(6, Math.ceil(Math.pow(30, 1.0 / sNumberLength)));
  var queries = buildDatamuseQueries(sTopics, sLastWord, iTarget, iPos);
  var seen = {};
  var possibles = getLocalCandidates(iTarget, maxCount, iPos, sNumberLength);

  possibles.forEach(function(item) {
    seen[item.word] = true;
  });

  if (possibles.length >= maxCount) {
    return prioritizeCandidates(possibles);
  }

  for (const query of queries) {
    if (isExpired(deadline)) {
      break;
    }

    try {
      var json = await datamuseWords(query, deadline);
      var candidates = filterCandidates(json, iTarget, maxCount, iPos, sNumberLength);

      candidates.forEach(function(item) {
        if (!seen[item.word]) {
          seen[item.word] = true;
          possibles.push(item);
        }
      });

      if (possibles.length >= maxCount && iPos === 0) {
        break;
      }
    } catch (error) {
      // Ignore failed API attempts and continue to fallback queries.
    }
  }

  possibles.sort(function(a, b) {
    return b.f - a.f;
  });

  return prioritizeCandidates(possibles);
}

var parsedArgs = generatorArgs.parseGeneratorArgs(process.argv.slice(2), {
  acceptMaxSyllables: true,
  defaultMaxSyllables: 16
});
var number = parsedArgs.number;
var maxsyl = parsedArgs.maxsyl;
var themes = parseThemes(parsedArgs.theme);

if (!parsedArgs.numberProvided) {
  console.log("Random number", number);
}

function moveTags(word){
  if(word.tags){
    word.tags.forEach((tag)=>{
      var parts = tag.split(":")
      if(parts.length>1){
        word[parts[0]] =parts[1]
      }
    })
  }
  return word;

}
async function getNextWord(sSentence, sTopics, sNumber, iPos, sLastWord, iSyllables, bBoost, deadline, chosenWords) {
  var results = [];
  var boostedResults = [];
  var iNum = parseInt(sNumber[iPos])
  var currentWords = chosenWords || [];

  if (isExpired(deadline)) {
    return results;
  }

  if(iNum < 3 && !bBoost){
    boostedResults = await getNextWord(sSentence, sTopics, sNumber, iPos, sLastWord, iSyllables, true, deadline, currentWords)
    if (boostedResults.length !== 0) {
      return boostedResults;
    }
  }

  var iTarget = iNum+(bBoost?10:0)
  var possibles = await getCandidates(sTopics, sLastWord, iTarget, iPos, sNumber.length, deadline)
  var nextPos = iPos + 1

  for (const item of possibles) {
    if (isExpired(deadline)) {
      break;
    }

    var sNewTopics = sTopics
    if (item.word.length > 1 && item.tags[0] == 'n') {
      sNewTopics += " " + item.word
    }

    var sNewSentence = sSentence + " " + item.word
    var stresses = stressNum(item.word)
    var iNewSyllables = iSyllables + item.numSyllables
    var nextWords = currentWords.concat([item]);

    if (nextPos < sNumber.length) {
      if (iNewSyllables <= maxsyl) {
        results = results.concat(await getNextWord(sNewSentence, sNewTopics, sNumber, nextPos, item.word, iNewSyllables, false, deadline, nextWords))
      }
    } else if(iNewSyllables <= maxsyl){
      results.push({
        sentence: sNewSentence,
        syllables: iNewSyllables,
        firstWord: sNewSentence.split(/\s+/)[2] || item.word,
        words: nextWords
      })
    }
  }

  return results;
}

async function getSentences(sStart, nNum, deadline) {
  var aStart = sStart.split(" ")
  var iSyllables = 0;
  var minimumSyllables = getMinimumSyllables(maxsyl);
  aStart.forEach((item) => {
    var stresses = stressNum(item)
    iSyllables += stresses.length
  })

  var results = await getNextWord(sStart, sStart, nNum.toString(), 0, aStart[aStart.length - 1], iSyllables, false, deadline, [])
  var seen = {};
  var filteredResults = results.filter(function(item) {
    return item.syllables >= minimumSyllables;
  });

  if (filteredResults.length === 0) {
    filteredResults = results.slice();
  }

  filteredResults.sort(function(a, b) {
    return scoreSentenceResult(b) - scoreSentenceResult(a);
  });

  filteredResults = prioritizeCandidates(filteredResults);

  return filteredResults.filter(function(item) {
    if (seen[item.sentence]) {
      return false;
    }

    seen[item.sentence] = true;
    return true;
  }).slice(0, MAX_RESULTS_PER_START).map(function(item) {
    item.start = sStart;
    item.signature = getSentenceSignature(item.sentence, sStart);
    item.tailSignature = getSentenceTailSignature(item.sentence, sStart);
    return item;
  });
}

function getStartDeadline(deadline, groupsFound, variantCount) {
  var remainingMs = Math.max(0, deadline - Date.now());
  var remainingStarts = Math.max(1, variantCount - groupsFound);
  var perStartBudget = Math.max(1000, Math.floor(remainingMs / remainingStarts));

  return Math.min(deadline, Date.now() + perStartBudget);
}

function flattenSentenceGroups(groups) {
  var merged = [];
  var seen = {};
  var seenSignatures = {};
  var seenTailSignatures = {};
  var maxResults = Math.min(MAX_TOTAL_RESULTS, groups.length * DISPLAY_RESULTS_PER_START);

  groups.forEach(function(group) {
    var keptForStart = 0;

    group.forEach(function(result) {
      if (keptForStart >= DISPLAY_RESULTS_PER_START || merged.length >= maxResults) {
        return;
      }

      if (seen[result.sentence]) {
        return;
      }

      if (result.signature && seenSignatures[result.signature]) {
        return;
      }

      if (result.tailSignature && seenTailSignatures[result.tailSignature] >= 2) {
        return;
      }

      seen[result.sentence] = true;
      if (result.signature) {
        seenSignatures[result.signature] = true;
      }
      if (result.tailSignature) {
        seenTailSignatures[result.tailSignature] = (seenTailSignatures[result.tailSignature] || 0) + 1;
      }

      merged.push(result);
      keptForStart += 1;
    });
  });

  return merged;
}

async function getVariedSentences(parsedArgs, nNum, deadline) {
  var groups = [];
  var seenStarts = {};
  var variantCount = parsedArgs.startProvided ? 1 : START_VARIANT_COUNT;
  var attempts = 0;
  var maxAttempts = parsedArgs.startProvided ? 1 : START_VARIANT_COUNT * 3;
  var usePreviewStart = true;

  while (groups.length < variantCount && attempts < maxAttempts && !isExpired(deadline)) {
    var currentStart = usePreviewStart ? parsedArgs.start : parsedArgs.nextStart().start;
    var startDeadline = getStartDeadline(deadline, groups.length, variantCount);
    var group;

    usePreviewStart = false;
    attempts += 1;

    if (seenStarts[currentStart]) {
      continue;
    }

    seenStarts[currentStart] = true;
    group = await getSentences(currentStart, nNum, startDeadline);

    if (group.length !== 0) {
      groups.push(group);
    }
  }

  return flattenSentenceGroups(groups).slice(0, MAX_TOTAL_RESULTS);
}

async function main() {
  var deadline = Date.now() + MAX_RUNTIME_MS;
  var results = await getVariedSentences(parsedArgs, number, deadline);
  var currentStart;

  if (results.length === 0) {
    console.log("No sentences found.");
    return;
  }

  results.forEach(function(result) {
    if (result.start !== currentStart) {
      currentStart = result.start;
      console.log("Start", currentStart);
    }

    console.log(result.sentence);
  });
}

main().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});

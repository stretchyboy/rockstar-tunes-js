const COMMON_PREFIXES = ['a', 'the', 'my', 'your', 'their', 'his', 'her'];
const ASSIGNMENTS = ['is', 'was', 'are', 'am', 'were'];//, "'s", "'re"];
const DEFAULT_ASSIGNMENTS = ['is', 'was'];
const DEFAULT_COMMON_VARIABLES = [
  'my heart',
  'your love',
  'their fire',
  'his dream',
  'her soul',
  'the night'
];
const DEFAULT_PROPER_VARIABLES = [
  'Doctor Feelgood',
  'Billie Jean',
  'Midnight Rider',
  'Sugar Magnolia',
  'Johnny B. Goode'
];
const THEME_PROPER_VARIABLES = {
  blues: [
    'Delta Saint',
    'Ramblin Mercy',
    'Midnight Harlan',
    'Bayou Grace',
    'Blind Samson'
  ],
  glam: [
    'Velvet Venus',
    'Neon Duchess',
    'Starfire Lola',
    'Silver Sable',
    'Crystal Rouge'
  ],
  heartland: [
    'County Grace',
    'Prairie June',
    'Railway Jack',
    'Mason Riley',
    'Harvest Rose'
  ],
  metal: [
    'Iron Reaper',
    'Raven Shard',
    'Crimson Fang',
    'Onyx Viper',
    'Steel Tyrant'
  ],
  psychedelic: [
    'Aurora Bloom',
    'Opaline Dream',
    'Solaris Drift',
    'Echo Mirage',
    'Lucid Raven'
  ]
};

function normalizeThemes(themeNames) {
  if (!themeNames) {
    return [];
  }

  if (!Array.isArray(themeNames)) {
    themeNames = String(themeNames).split(',');
  }

  return themeNames.map(function(name) {
    return String(name || '').trim().toLowerCase();
  }).filter(function(name, index, items) {
    return name.length !== 0 && items.indexOf(name) === index && THEME_PROPER_VARIABLES[name];
  });
}

function getDefaultVariableNames(themeNames) {
  var variables = DEFAULT_COMMON_VARIABLES.concat(DEFAULT_PROPER_VARIABLES);

  normalizeThemes(themeNames).forEach(function(theme) {
    variables = variables.concat(THEME_PROPER_VARIABLES[theme]);
  });

  return variables;
}

function choice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  var shuffled = items.slice();
  var index;
  var swapIndex;
  var temp;

  for (index = shuffled.length - 1; index > 0; index--) {
    swapIndex = Math.floor(Math.random() * (index + 1));
    temp = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = temp;
  }

  return shuffled;
}

function collapseWhitespace(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function isNumericArgument(value) {
  return /^-?\d+(\.\d+)?$/.test(value);
}

function parseNamedArgument(value) {
  var match = String(value || '').match(/^([a-z]+)\s*[:=]\s*(.+)$/i);

  if (!match) {
    return null;
  }

  return {
    key: match[1].toLowerCase(),
    value: match[2].trim()
  };
}

function isAssignmentWord(value) {
  return ASSIGNMENTS.indexOf((value || '').toLowerCase()) !== -1;
}

function suggestNumber() {
  var digitCount = 2 + Math.floor(Math.random() * 6);
  var digits = String(1 + Math.floor(Math.random() * 9));

  while (digits.length < digitCount) {
    digits += String(Math.floor(Math.random() * 10));
  }

  return digits;
}

function normalizeCommonVariable(value) {
  var words = collapseWhitespace(value).split(' ').map(function(word) {
    return word.replace(/^\W+|\W+$/g, '').toLowerCase();
  }).filter(Boolean);

  if (words.length < 2 || COMMON_PREFIXES.indexOf(words[0]) === -1) {
    return null;
  }

  return words.join(' ');
}

function normalizeProperWord(word) {
  var cleanWord = word.replace(/^[^A-Za-z]+|[^A-Za-z.]+$/g, '');

  if (!cleanWord) {
    return '';
  }

  if (/^[A-Za-z]\.$/.test(cleanWord)) {
    return cleanWord[0].toUpperCase() + '.';
  }

  cleanWord = cleanWord.replace(/\./g, '');
  return cleanWord[0].toUpperCase() + cleanWord.slice(1).toLowerCase();
}

function normalizeVariableName(value) {
  if (!value) {
    return null;
  }

  var commonVariable = normalizeCommonVariable(value);
  if (commonVariable) {
    return commonVariable;
  }

  var properWords = collapseWhitespace(value).split(' ').map(normalizeProperWord).filter(Boolean);

  if (properWords.length >= 2) {
    return properWords.join(' ');
  }

  if (properWords.length === 1) {
    return 'my ' + properWords[0].toLowerCase();
  }

  return null;
}

function normalizeAssignment(value) {
  var lowerValue = (value || '').toLowerCase();

  if (isAssignmentWord(lowerValue)) {
    return lowerValue;
  }

  if (lowerValue === 'be' || lowerValue === 'am' || lowerValue === 'are') {
    return 'is';
  }

  return choice(DEFAULT_ASSIGNMENTS);
}

function createStart(variableName, assignment) {
  return variableName + ' ' + assignment;
}

function createStartGenerator(options) {
  var config = options || {};
  var normalizedVariableName = normalizeVariableName(config.variableName);
  var normalizedAssignment = config.assignment === undefined ? null : normalizeAssignment(config.assignment);
  var fallbackVariableNames = shuffle(getDefaultVariableNames(config.themeNames));
  var fallbackIndex = 0;

  return function nextStart() {
    var variableName;
    var assignment;

    if (normalizedVariableName) {
      variableName = normalizedVariableName;
    } else {
      if (fallbackIndex >= fallbackVariableNames.length) {
        fallbackVariableNames = shuffle(fallbackVariableNames);
        fallbackIndex = 0;
      }

      variableName = fallbackVariableNames[fallbackIndex];
      fallbackIndex += 1;
    }

    assignment = normalizedAssignment || normalizeAssignment();

    return {
      variableName: variableName,
      assignment: assignment,
      start: createStart(variableName, assignment)
    };
  };
}

function parseLegacyStartPhrase(value) {
  var words = collapseWhitespace(value).split(' ');
  var assignment = words[words.length - 1].toLowerCase();

  if (words.length < 3 || !isAssignmentWord(assignment)) {
    return null;
  }

  return {
    variableName: words.slice(0, -1).join(' '),
    assignment: assignment
  };
}

function parseGeneratorArgs(args, options) {
  var config = options || {};
  var number;
  var maxsyl;
  var theme;
  var variableName;
  var assignment;
  var variableNameProvided;
  var assignmentProvided;
  var resolvedArgs;
  var nextStart;

  args.forEach(function(rawArg) {
    var arg = String(rawArg || '').trim();
    var legacyStart;
    var namedArg;

    if (!arg) {
      return;
    }

    namedArg = parseNamedArgument(arg);
    if (namedArg && (namedArg.key === 'theme' || namedArg.key === 'themes') && theme === undefined) {
      theme = namedArg.value;
      return;
    }

    if (isNumericArgument(arg)) {
      if (number === undefined) {
        number = arg;
        return;
      }

      if (config.acceptMaxSyllables && maxsyl === undefined) {
        maxsyl = parseInt(arg, 10);
      }

      return;
    }

    if (variableName === undefined && assignment === undefined) {
      legacyStart = parseLegacyStartPhrase(arg);
      if (legacyStart) {
        variableName = legacyStart.variableName;
        assignment = legacyStart.assignment;
        variableNameProvided = true;
        assignmentProvided = true;
        return;
      }
    }

    if (variableName === undefined) {
      variableName = arg;
      variableNameProvided = true;
      return;
    }

    if (assignment === undefined) {
      assignment = arg;
      assignmentProvided = true;
    }
  });

  nextStart = createStartGenerator({
    variableName: variableName,
    assignment: assignment,
    themeNames: theme
  });
  resolvedArgs = nextStart();

  return {
    number: number === undefined ? suggestNumber() : number,
    numberProvided: number !== undefined,
    theme: theme,
    variableName: resolvedArgs.variableName,
    assignment: resolvedArgs.assignment,
    start: resolvedArgs.start,
    maxsyl: maxsyl === undefined ? config.defaultMaxSyllables : maxsyl,
    variableNameProvided: variableNameProvided === true,
    assignmentProvided: assignmentProvided === true,
    startProvided: variableNameProvided === true || assignmentProvided === true,
    nextStart: nextStart
  };
}

module.exports = {
  createStartGenerator: createStartGenerator,
  getDefaultVariableNames: getDefaultVariableNames,
  parseGeneratorArgs: parseGeneratorArgs
};
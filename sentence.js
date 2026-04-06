// is, or the aliases was or were
//Common variables consist of one of the keywords a, an, the, my or your

var Sentencer = require('sentencer');
var generatorArgs = require('./src/generator-args');

function choice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function hasNoHyphen(word) {
  return word.indexOf('-') === -1;
}

Sentencer.configure({
  actions: {
    noun_l: function(i) {
      var nouns = Sentencer._nouns.filter(function(word) {
        return (word.length % 10) == i && hasNoHyphen(word)
      });
      return choice(nouns);
    },
    adjective_l: function(i) {
      return choice(Sentencer._adjectives.filter(function(word) {
        return (word.length % 10) == i && hasNoHyphen(word)
      }));
    }
  }
});

var parsedArgs = generatorArgs.parseGeneratorArgs(process.argv.slice(2));
var number = parsedArgs.number;

console.log("Generating sentence for ", number);
console.log("Using variable", parsedArgs.variableName);
console.log("Using assignment", parsedArgs.assignment);

function getFragment(number, first) {
  var digits = number.split("");
  var template = '';
  if (digits[0] == 3) {
    if (first) {
      template += " one";
    } else {
      template += " and";
    }
    digits.shift();
  }

  if (digits.length < 5) {
    for (j = 0; j < digits.length - 1; j++) {
      template += " {{ adjective_l(" + digits[j] + ") }}"
    }
    template += " {{ noun_l(" + digits[digits.length - 1] + ") }}"
  }
  return template
}

function getTemplate(start, number) {
  var template = start;
  var parts = number.split(".");
  var first = true
  template += parts.map(function(part) {
    var frag = getFragment(part, first);
    first = false;
    return frag;
  }).join(".");
  return template;
}

const rockstar = require('./src/rockstar');

function getWords(number, template) {

  var heart = 0;
  var tries = 0;
  var words;
  while (heart != parseFloat(number) && tries < 10) {
    tries++;
    words = Sentencer.make(template);
    //console.log(words);

    try {
      eval(rockstar.compile(words + "\n")) //Whisper my heart\n"));
    } catch (err) {
      console.log("Didn't like '" + words + "'")
    }
    //console.log("heart", heart)
  }

  return words;
}

function getSentence(start, num){
  var template = getTemplate(start, num);
  //console.log(template);
  var sentence = getWords(num, template);
  //console.log(sentence)
  return sentence;
}

function main() {
  for (var k = 0; k < 5; k++) {
    var currentStart = k === 0 ? parsedArgs.start : parsedArgs.nextStart().start;
    var sentence = getSentence(currentStart, number);

    console.log(sentence);
  }
}

main();

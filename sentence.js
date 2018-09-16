// is, or the aliases was or were
//Common variables consist of one of the keywords a, an, the, my or your

var Sentencer = require('sentencer');
var natural = require('natural');
var nounInflector = new natural.NounInflector();
var articles = require('articles/lib/Articles.js');
var randy = require('randy');

Sentencer.configure({
  actions: {
    number: function(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    },
    noun_l: function(i) {
      var nouns = Sentencer._nouns.filter(function(word) {
        return (word.length % 10) == i
      });
      return randy.choice(nouns);
    },
    a_noun_l: function(i) {
      return articles.articlize(this.noun_l(i));
    },
    nouns_l: function(i) {
      return nounInflector.pluralize(this.noun_l(i));
    },
    adjective_l: function(i) {
      return randy.choice(Sentencer._adjectives.filter(function(word) {
        return (word.length % 10) == i
      }));
    },
    an_adjective_l: function(i) {
      return articles.articlize(this.adjective_l(i));
    }
  }
});

var number = '' + process.argv[2];
if (number == "undefined") {
  number = '' + Math.round(Math.random() * 9999);
  console.log("Generating sentence for ",number);
}

var init = '' + process.argv[3];
if (init == "undefined") {
  init = "My heart is";
  console.log("Starting with", init);
}

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
  parts = number.split(".");
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
  while (heart != parseFloat(number) && tries < 10) {
    tries++;
    var words = Sentencer.make(template);
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

for (k = 0; k < 5; k++) {
  console.log(getSentence(init, number));
}

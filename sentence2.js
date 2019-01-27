// is, or the aliases was or were
//Common variables consist of one of the keywords a, an, the, my or your

var Iconv  = require('iconv').Iconv;
var writeGood = require('write-good');
require('node-window-polyfill').register();
let grammarland = require('grammarland');
const words = require('cmu-pronouncing-dictionary')
const datamuse = require('datamuse');


function stressNum(word) {
  sW = word.toLowerCase(word)
  out = "?"
  if (proc = words[sW]) {
    out = proc.replace(/[^0-2]/g, "")
  }
  return out
}

var number = '' + process.argv[2];
if (number == "undefined") {
  number = '' + Math.round(Math.random() * 9999);

}
console.log("Generating sentence for ", number);


var init = '' + process.argv[3];
if (init == "undefined") {
  init = "My heart is";
}
console.log("Starting with", init);

var maxsyl = '' + process.argv[4];
if (maxsyl == "undefined") {
  maxsyl = 16;
}
console.log("Max syllables per line", maxsyl);


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

function moveTags(word){
  if(word.tags){
    word.tags.forEach((tag)=>{
      parts = tag.split(":")
      if(parts.length>1){
        word[parts[0]] =parts[1]
      }
    })
  }
  return word;

}
function getNextWord(sSentence, sTopics, sNumber, iPos, sLastWord, iSyllables, bBoost) {
  iNum = parseInt(sNumber[iPos])

  if(iNum < 3 && !bBoost){
    getNextWord(sSentence, sTopics, sNumber, iPos, sLastWord, iSyllables, true)
  }

  iTarget = iNum+(bBoost?10:0)
  datamuse.words({
    rel_bga: sLastWord,
    sp: "?".repeat(iTarget),
    md: "srpf",
    topics: sTopics
  }).then((json) => {
    possibles = json.filter((item, i) => {

      if (item.word.length !== iTarget) {
        return false;
      }

      if (item.word.replace(/\W/, "").length == 0) {
        return false;
      }
      if (i > Math.ceil(Math.pow(30, 1.0/(sNumber.length)))) {
        return false;
      }
      return true
    }).map(moveTags).sort((a,b)=>{return b.f-a.f})

    iPos++

    possibles.forEach((item) => {
      sNewTopics = sTopics
      if (item.word.length > 1 && item.tags[0] == 'n') {
        sNewTopics += " " + item.word
      }
      sNewSentence = sSentence + " " + item.word
      stresses = stressNum(item.word)
      iNewSyllables = iSyllables + item.numSyllables

      if (iPos < sNumber.length) {
        if (iNewSyllables > maxsyl) {
          console.log("Too Long:", sNewSentence);
        } else {
          sLastWord = item.word
          getNextWord(sNewSentence, sNewTopics, sNumber, iPos, sLastWord, iNewSyllables)
        }
      } else if(iNewSyllables <= maxsyl){
        try {
          bSentence = (sNewSentence + "!").validateSentence();

          var suggestions = writeGood(sNewSentence)
          if(suggestions.length == 0){
            correct ++
            console.log(sNewSentence, "Syllables", iNewSyllables);
          }

        } catch (e) {
          // statements to handle any exceptions
          console.log(sNewSentence, e); // pass exception object to error handler
        }

      }
    })
  });
}

function getSentences(sStart, nNum) {
  aStart = sStart.split(" ")
  iSyllables = 0;
  aStart.forEach((item) => {
    stresses = stressNum(item)
    iSyllables += stresses.length
  })
  getNextWord(sStart, sStart, nNum.toString(), 0, aStart[aStart.length - 1], iSyllables)
  //.then(function(res){console.log(res)})
  //return sentence;
}

correct = 0
getSentences(init, number);
console.log(correct);

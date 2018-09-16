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
      return Math.floor( Math.random() * (max - min) ) + min;
    },
    noun_l: function(i) {
        var nouns = Sentencer._nouns.filter(function(word){
          return ( word.length % 10) == i
        });
        return randy.choice(nouns);
   },
   a_noun_l: function(i) {
     return articles.articlize( this.noun_l(i) );
   },
   nouns_l: function(i) {
     return nounInflector.pluralize( this.noun_l(i) );
   },
   adjective_l: function(i) {
     return randy.choice(Sentencer._adjectives.filter(function(word){
       return ( word.length % 10) == i
     }));
   },
   an_adjective_l: function(i) {
     return articles.articlize( this.adjective_l(i) );
}
  }
});



var  number = ''+process.argv[2];
if(number == "undefined"){
  number = ''+ Math.round(Math.random()*9999);
  console.log(number)
}
var digits = number.split("")
var template = "My heart was"
if (digits.length < 5){
  for(j = 0; j < digits.length - 1 ; j++){
    template += " {{ adjective_l("+digits[j]+") }}"
  }
  template += " {{ noun_l("+digits[digits.length -1]+") }}"
}

function getSentence(number){
  var heart = 0;
  while (heart != parseFloat(number)){
    var words = Sentencer.make(template);
    //console.log(words);

    const rockstar = require('./src/rockstar');
    try{
    eval(rockstar.compile(words+"\n"))//Whisper my heart\n"));
} catch(err){
  console.log("didnt like", words)
}
    //console.log("heart", heart)
  }
  return words;
}

for(k=0 ; k<5; k++){
  console.log(getSentence(number));
}

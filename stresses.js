const words = require('cmu-pronouncing-dictionary')

str = "Papa was a rolling stone\nPapa was a rolling stone ( hey hey hey hey )\nWherever he laid his hat was his home\nAnd when he died\nAll he left us was a loan"

function stressNum(word){
sW=word.toLowerCase(word)
out = "?"
 if(proc = words[sW]){
   out = proc.replace(/[^0-2]/g,"")

}
  return out
}

function lineStresses(line){
  clean = line.replace(/[^\w ]/g,"").replace(/\s\s+/," ").trim().toLowerCase()
  sS = clean.split(" ").map(stressNum).join("");
  console.log(clean, sS, sS.length)

  return sS
}

lines = str.split("\n").map(lineStresses);
console.log(lines)

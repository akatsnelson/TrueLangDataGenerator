const fs = require('fs')
const util = require('util')
const dataSet = require('path').join(__dirname, '../dataSet')
const csvData = require('path').join('../data.csv')

const json2csv = require('json2csv').parse
const fields = ['class', 'tagged_texts']
const opts = {fields}

class MainGenerator {
  read (path) {
    let textsPath = []
    let data = {}

    fs.readdirSync(path).forEach(file => {
      if (file.toLowerCase().indexOf('.txt') !== -1) {
        let text = fs.readFileSync(path + '\\' + file, 'utf8')
        text = this.correct(text)
        textsPath.push(text)
      } else {
        data[file] = this.read(path + '\\' + file)
      }
    })
    if (textsPath.length > 0) {
      data = textsPath
    }
    return data
  }

  correct (text) {
    let resultText = ''
    text.split('\n').forEach(str => {
      str = str.trim()
      if (!isNaN(+str)) {
        return
      }
      if (str === '') {
        return
      }
      if (str.match(/[IVX]/) && str.length < 16) {
        return
      }
      if (str.toLowerCase().indexOf('глава') !== -1 && str.length < 64) {
        return
      }
      if (str.toLowerCase().indexOf('часть') !== -1 && str.length < 64) {
        return
      }
      if (str.toLowerCase().indexOf('том') !== -1 && str.length < 64) {
        return
      }
      resultText += str + ' '
    })
    return resultText.trim()
  }

  getTexts (data) {
    let resultData = {}
    if (Array.isArray(data[Object.keys(data)[0]])) {
      return data
    } else {
      for (let key in data) {
        resultData = Object.assign(this.getTexts(data[key]), resultData)
      }
      return resultData
    }

  }

  correctSentences (sentences) {
    let newSentences = []
    for (let i = 0; i < sentences.length - 1; i = i + 2) {
      sentences[i] = sentences[i].trim()
      newSentences.push(sentences[i] + sentences[i + 1])
    }
    return newSentences
  }

  divide (data, maxCountSentence = 100) {
    for (let author in data) {
      let texts = data[author]
      let sentences = []
      texts.forEach(text => {
        text = text.replace(/\r?\n/g, ' ')
        text = text.trim()
        let sentence = text.split(/([.!?]+)/g)
        sentence = this.correctSentences(sentence)
        let qos = sentence.length - 1
        while (qos !== 0) {
          let qose = qos
          if (qos >= maxCountSentence) {
            qose = maxCountSentence
          }
          let random = Math.floor(Math.random() * (qose + 1))
          if (random === 0) continue
          qos -= random
          let sn = ''
          sentence.forEach((s, i) => {
            if (i < random) {
              sn += s
            }
          })
          sentences.push(sn)
          sentence.splice(0, random)
        }
        data[author] = sentences
      })
    }
    return data
  }

  dataToCSV (data) {
    let csv = []
    for (let author in data) {
      data[author].forEach(text => {
        let o = {}
        o.class = author
        o.tagged_texts = text
        csv.push(o)
      })
    }
    try {
      const csvR = json2csv(csv, opts)
      fs.writeFileSync(csvData, csvR)
    } catch (err) {
      console.error(err)
    }
  }
}

let mg = new MainGenerator()
let data = mg.read(dataSet)
data = mg.getTexts(data.lit)
data = mg.divide(data, 100)
data = mg.dataToCSV(data)
console.log(data)
const request = require('request')
const fs = require('fs')
const path = require('path')
// const math = require('mathjs')
const levenshtein = require('./levenshtein')

const apis = [
  {
    name: 'cf-tesseract-3',
    extension: 'pdf',
    url: 'https://tesseract-seb.cfapps.eu10.hana.ondemand.com/api/ocr',
    getText: (body) => { return body.text }
  },
  {
    name: 'leonardo-network',
    extension: 'network',
    url: 'https://sandbox.api.sap.com/ml/ocr/ocr',
    formData: {
      options: JSON.stringify({ stop: true })
    },
    headers: {
      'Accept': 'application/json',
      'APIKey': 'F9T4RcOBfWgRmaG3egzTBlnssxJ6siOZ'
    },
    getText: (body) => {
      return body && body.predictions ? body.predictions[0] : ''
    }
  },
  {
    name: 'leonardo',
    extension: 'pdf',
    url: 'https://sandbox.api.sap.com/ml/ocr/ocr',
    formData: {
      options: JSON.stringify({ lang: 'en', output_type: 'txt', modelType: 'lstm_fast' })
    },
    headers: {
      'Accept': 'application/json',
      'APIKey': 'F9T4RcOBfWgRmaG3egzTBlnssxJ6siOZ'
    },
    getText: (body) => {
      return body && body.predictions ? body.predictions[0] : ''
    }
  },
  // {
  //   name: 'leonardo',
  //   extension: 'pdf',
  //   url: 'https://sandbox.api.sap.com/ml/ocr/ocr',
  //   formData: {
  //     options: JSON.stringify({ lang: 'en', output_type: 'txt' })
  //   },
  //   headers: {
  //     'Accept': 'application/json',
  //     'APIKey': 'F9T4RcOBfWgRmaG3egzTBlnssxJ6siOZ'
  //   },
  //   getText: (body) => {
  //     return body && body.predictions ? body.predictions[0] : ""
  //   },
  // }, {
  //   name: 'ms-cognitive-service',
  //   extension: 'jpeg',
  //   url: 'https://westeurope.api.cognitive.microsoft.com/vision/v2.0/ocr?en&true',
  //   headers: {
  //     'Content-Type': 'multipart/form-data',
  //     'Ocp-Apim-Subscription-Key': '3572dc0e141449e4a2631df847c0484d'
  //   },
  //   getText: (body) => {
  //     return getTextInObject(body)
  //   }
]

// test different page_seg_mode apis
// ['lstm_precise', 'lstm_fast', 'lstm_standard', 'no_lstm', 'all'].forEach(modelType =>{
//   [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach(seg =>{
//     const api = Object.assign({}, leonardoApi)
//     api.name += `-seg${seg}-${modelType}`
//     api.seg = seg
//     api.modelType = modelType
//     api.formData = {
//       options: JSON.stringify({ lang: 'en', output_type: 'txt', page_seg_mode: seg, model_type: modelType })
//     }
//     apis.push(api)
//   })
// })

// call an API, return a promise
const callApi = (api, fileName, imgPath) => {
  // prepare formData with provided formData
  const formData = Object.assign({}, api.formData ? api.formData : {}, { files: fs.createReadStream(imgPath) })
  // init runtime count
  const start = process.hrtime()
  // return a promise for the api call
  return new Promise((resolve, reject) => {
    // post the file via form-data
    request.post({
      url: api.url,
      formData,
      headers: api.headers
    }, (err, httpResponse, body) => {
      // reject in case of error
      if (err) return reject(err)
      // else return the filename, runtime and returned body
      const elapsedTime = process.hrtime(start)
      const result = {
        fileName,
        elapsedTime: Math.round(elapsedTime[0] * 1000 + elapsedTime[1] / 1000000),
        body
      }
      resolve(result)
    })
  })
}

const referenceText = 'Human Resources Synergy 201, Bergman Street phone: + 31 5 66 999 888 fax: + 69 2 5664 445 Springfield, MO 12004 ssc.hr@synergy.com Emergency Contact List Dear Emily Clark, At Synergy we introduced last year a programme. In Case of Emergency, ie, firefighters, and police officers, as well as hospital personnel, to contact your next of kin to obtain important medical or support information. It is important for your safety in such event that the information available to us is up-to date. Below is a list of emergency contacts we have in our records: Relationship Contact Name Phone E-mail Wife Suzy User 999 645 2000 Please review this carefully and make any changes if needed. Yours Sincerely Tom Clark. Synergy Technology and Services Pvt. Ltd. 84, Wonderfull City Tel.: +91 80 33333333 Management: John Nash Hope Road Fax : + 91 80 33333333 Registered Ofﬁce: pentadore #123456. In the middle Web: www.synergy.corp E-mail:contactus@synergy.com Employee Reference: Emily Clark - admin Page: - of -'

// compute precision between reference text and returned text
// 100 means exact match (no distance)
// 0 means as much permutation as chars
const accuracy = (text, compareFullText = true) => {
  const textSingleSpace = text.replace(/\\n/g, ' ').replace(/\s+/g, ' ')
  if (compareFullText) return Math.round((textSingleSpace.length - levenshtein(referenceText, textSingleSpace)) / textSingleSpace.length * 100)
  const referenceWords = referenceText.split(' ')
  const words = textSingleSpace.split(' ')
  let countSuccess = 0
  let countTotal = 0
  // compute how much text words exists in reference
  referenceWords.forEach(word => {
    if (words.indexOf(word)!==-1) countSuccess++
    countTotal++
  })
  // compute how much reference words exists in text
  words.forEach(word => {
    if (referenceWords.indexOf(word)!==-1) countSuccess++
    countTotal++
  })
  return Math.round(countSuccess / countTotal * 100)
}

// prepare a promise chain
let ready = Promise.resolve()
// read all files in the images folder
const readFiles = fs.readdirSync(path.join(__dirname, 'files'))
// bypass system files
.filter(fileName => fileName.indexOf('.') !== 0)
// .slice(3, 5)
let nbrSteps = 0
let step = 0

// concat 10 times
const files = []
for (let i=0; i<10; i++) files.push(...readFiles)


// return first captured match
const strMatch = (str, regex) => {
  const match = str.match(regex)
  if (match) {
    return match[1]
  } else {
    return null
  }
}

// process result, build stats
let statsFile = 'url\tfile\tfileShort\tdpi\trotation\ttime\tprecision\tseg\tmodelType\telapseTime\tnetworkTime\tconvertTime\ttesseractTime\n'
const networkRuntimes = {}
const processResult = (api, {fileName, elapsedTime, body}) => {
  const data = JSON.parse(body)
  // classify the test
  const fileNameShort = strMatch(fileName, /^([^\.]*)/)
  const dpi = strMatch(fileName, /_(\d*)dpi/)
  const rotation = strMatch(fileName, /_r(\d*)/)
  let currentAccuracy
  // we are in network measurment
  if (api.extension === 'network') {
    // store for next access
    networkRuntimes[fileNameShort] = elapsedTime
  } else {
    // compute accuracy
    currentAccuracy = accuracy(api.getText(data))
  }
  // Compute network time and store it
  const networkRuntime = data.tesseractRuntime ? parseInt(elapsedTime - (data.convertRuntime + data.tesseractRuntime)) : networkRuntimes[fileNameShort] ? parseInt(networkRuntimes[fileNameShort]) : 0
  const runTime = data.tesseractRuntime ? parseInt(data.convertRuntime + data.tesseractRuntime) : parseInt(elapsedTime-networkRuntime)
  // add stats
  console.log(`${Math.round((++step)/nbrSteps*100)}% ${api.name}, ${fileName} : ${dpi} ${rotation} ${runTime} acc:${currentAccuracy} time:${parseInt(elapsedTime)} net:${networkRuntime} conv:${parseInt(data.convertRuntime)} tess:${parseInt(data.tesseractRuntime)}`)
  statsFile += `${api.name}\t${fileName}\t${fileNameShort}\t${dpi}\t${rotation}\t${runTime}\t${currentAccuracy}\t${api.seg}\t${api.modelType}\t${parseInt(elapsedTime)}\t${networkRuntime}\t${parseInt(data.convertRuntime)}\t${parseInt(data.tesseractRuntime)}\n`
}


// process files
files.map(fileName => {
  nbrSteps++
  // loop each api
  apis.map(api => {
    // keep only correct file extension
    if (fileName.indexOf(`.${api.extension}`) <= 0) return 
    console.log(`== ${fileName}`)
    // chain promises
    ready = ready.then(() => {
      // call the api
      return callApi(api, fileName, path.join(__dirname, 'files', fileName))
      .then(result => {
        if (result) processResult(api, result)
      })
      .catch(error => {
        console.error(error)
      })
    })
  })
})

ready.then(() => {
  // write stats
  console.log('== Write stats ==')
  fs.writeFileSync('benchmark.txt', statsFile)
})

/*
// return an object as an array of kays
const keys = (items) => {
  return Object.keys(items).map(key => {
    items[key].key = key
    return items[key]
  })
}

// collect all 'text' items along the object structure
const getTextInObject = (input) => {
  const words = []
  const getTextInObjectInner = (object) => {
    if (object == null || typeof object !== 'object') return
    Object.keys(object).map(key => {
      if (key === 'text') words.push(object.text)
      return getTextInObjectInner(object[key])
    })
  }
  // search words
  getTextInObjectInner(input)
  return words.join(" ")
}
*/

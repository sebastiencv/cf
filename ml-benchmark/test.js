const request = require('request')
const fs = require('fs')
const path = require('path')
const math = require('mathjs')
const levenshtein = require('./levenshtein')

const apis = [{
  name: 'leonardo',
  extension: 'pdf',
  url: 'https://sandbox.api.sap.com/ml/ocr/ocr',
  formData: {
    options: JSON.stringify({ lang: 'en', output_type: 'txt' })
  },
  headers: {
    'Accept': 'application/json',
    'APIKey': 'F9T4RcOBfWgRmaG3egzTBlnssxJ6siOZ'
  },
  getText: (body) => {
    const data = JSON.parse(body)
    return data && data.predictions ? data.predictions[0] : ""
  }
  // }, {
  //   name: 'cf-tesseract-3',
  //  extension: 'jpeg',
//   url: 'https://app-seb.cfapps.eu10.hana.ondemand.com/api/ocr',
//     getText: (body) => body

}]

// concat 5 times
const apisN = apis // .concat(apis.concat(apis.concat(apis.concat(apis))))

// call an API, return a promise
const callApi = (api, fileName, imgPath) => {
  // keep only correct file extension
  if (fileName.indexOf(`.${api.extension}`) <= 0) return Promise.resolve()
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

// reference text
const fullText = "Human Resources Synergy 201, Bergman Street phone: + 31 5 66 999 888 fax: + 69 2 5664 445 Springfield, MO 12004 ssc.hr@synergy.com Emergency Contact List Dear Emily Clark, At Synergy we introduced last year a programme. In Case of Emergency, ie, firefighters, and police officers, as well as hospital personnel, to contact your next of kin to obtain important medical or support information. It is important for your safety in such event that the information available to us is up-to date. Below is a list of emergency contacts we have in our records: Relationship Contact Name Phone E-mail Wife Suzy User 999 645 2000 Please review this carefully and make any changes if needed. Yours Sincerely Tom Clark. Synergy Technology and Services Pvt. Ltd. 84, Wonderfull City Tel.: +91 80 33333333 Management: John Nash Hope Road Fax : + 91 80 33333333 Registered Ofﬁce: pentadore #123456. In the middle Web: www.synergy.corp E-mail:contactus@synergy.com Employee Reference: Emily Clark - admin Page: - of - "
const fullTextLength = fullText.length

// compute precision between reference text and returned text
// 100 means exact match (no distance)
// 0 means as much permutation as chars
const accuracy = (text) => {
  return Math.round((fullTextLength - levenshtein(fullText, text.replace(/\\n/g, ' ').replace(/\s+/g, ' '))) / fullTextLength * 100)
}

// process result, build stats
let statsFile = 'url\tdpi\trotation\ttime\tprecision\n'
const processResult = (api, {fileName, elapsedTime, body}) => {
  const currentAccuracy = accuracy(api.getText(body))
  const [,dpi,rotation] = fileName.match(/(\d*)dpi_r(\d*)/)
  // add stats
  statsFile += `${api.name}\t${dpi}\t${rotation}\t${elapsedTime}\t${currentAccuracy}\n`
}

// prepare a promise chain
let ready = Promise.resolve()
// process each images
Promise.all(
  // read all files in the images folder
  fs.readdirSync(path.join(__dirname, 'files'))
  // bypass system files
  .filter(file => file.indexOf('.') !== 0)
  // .slice(0, 3)
  // process files
  .map(file => {
    // loop each api
    return Promise.all(apisN.map(api => {
      // chain promises
      return ready = ready.then(() => {
        // call the api
        return callApi(api, file, path.join(__dirname, 'files', file))
        .then(result => {
          if (result) processResult(api, result)
        })
        .catch(error => console.error(error))
      })
    }))
  })
).then(() => {
  // write stats
  fs.writeFileSync('benchmark.txt', statsFile)
})

// return an object as an array of kays
const keys = (items) => {
  return Object.keys(items).map(key => {
    items[key].key = key
    return items[key]
  })
}


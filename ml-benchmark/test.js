const request = require('request')
const fs = require('fs')
const path = require('path')
const levenshtein = require('./levenshtein')

// call an API, return a promise
const callApi = (url, fileName, imgPath) => {
  const start = process.hrtime()
  return new Promise((resolve, reject) => {
    request.post({
      url,
      formData: {
        files: fs.createReadStream(imgPath)
      }
    }, (err, httpResponse, body) => {
      if (err) return reject(err)
      const result = {
        f: fileName,
        r: process.hrtime(start)[1] / 1000000,
        p: textDistance(body)
      }
      resolve(result)
    })
  })
}

const fullText = "Human Resources Synergy 201, Bergman Street phone: + 31 5 66 999 888 fax: + 69 2 5664 445 Springfield, MO 12004 ssc.hr@synergy.com Emergency Contact List Dear Emily Clark, At Synergy we introduced last year a programme. In Case of Emergency, ie, firefighters, and police officers, as well as hospital personnel, to contact your next of kin to obtain important medical or support information. It is important for your safety in such event that the information available to us is up-to date. Below is a list of emergency contacts we have in our records: Relationship Contact Name Phone E-mail Wife Suzy User 999 645 2000 Please review this carefully and make any changes if needed. Yours Sincerely Tom Clark. Synergy Technology and Services Pvt. Ltd. 84, Wonderfull City Tel.: +91 80 33333333 Management: John Nash Hope Road Fax : + 91 80 33333333 Registered Ofﬁce: pentadore #123456. In the middle Web: www.synergy.corp E-mail:contactus@synergy.com Employee Reference: Emily Clark - admin Page: - of - "
const fullTextLength = fullText.length

const textDistance = (text) => {

  return Math.round((fullTextLength - levenshtein(fullText, text.replace(/\\n/g, ' ').replace(/\s+/g, ' '))) / fullTextLength * 100)
}

// chain each image
let ready = Promise.resolve()
fs.readdirSync(path.join(__dirname, 'images')).forEach(file => {
  ready = ready.then(
    callApi('https://app-seb.cfapps.eu10.hana.ondemand.com/api/ocr', file, path.join(__dirname, 'images', file))
    .then(result => console.log(result))
    .catch(error => console.error(error))
  )
})

/*
TESS 3 

{ f: '150dpi_r1.jpeg', r: 872.031284, p: 26 }
{ f: '150dpi_r0.jpeg', r: 29.105844, p: 91 }
{ f: '200dpi_r1.jpeg', r: 857.485568, p: 51 }
{ f: '200dpi_r0.jpeg', r: 360.95978, p: 97 }
{ f: '300dpi.jpeg', r: 992.455971, p: 97 }
{ f: '75dpi.jpeg', r: 270.797578, p: 19 }
{ f: '150dpi.jpeg', r: 435.302379, p: 58 }
{ f: '200dpi.jpeg', r: 922.906558, p: 97 }
{ f: '300dpi_r1.jpeg', r: 327.201416, p: 50 }
{ f: '300dpi_r0.jpeg', r: 971.455489, p: 97 }

*/


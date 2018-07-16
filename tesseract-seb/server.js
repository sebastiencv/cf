/**
 * Credit to https://github.com/minhajkk/mulkiya-ocr MIT
 */

const express = require('express')
const tesseract = require('node-tesseract')
const multer = require('multer')
const fs = require('fs')
const exec = require('child_process').exec

// to run a shell command, will return a promise
const cmd = (cmdStr) => {
  return new Promise((resolve, reject) => {
    exec(cmdStr, (error, stdout, stderr) => {
      if (stderr && stderr.length > 0) console.log(`stderr: ${stderr}`)
      if (error !== null) {
        reject(error + stderr)
      } else {
        resolve(stdout)
      }
    })
  })
}

// mime uploader
const upload = multer({
  dest: './.tmp/',
  inMemory: false
})

/**
 * Following steps done under this functions.
 *
 * 1. Uploads image under '.tmp' folder.
 * 2. Grab text from image using 'tesseract-ocr'.
 * 3. Delete image from hard-disk.
 * 4. Return text in json format.
 *
 * @param req
 * @param res
 */
const processRequest = (req, res) => {
  // console.log(req)
  const restInputFile = req.file.path
  const tesseractInputFile = `${restInputFile}.png`
  const convertStart = process.hrtime()
  cmd(`convert -density 300 ${restInputFile} -depth 8 -strip -background white -alpha off -append ${tesseractInputFile}`)
    .then(() => {
      const convertEnd = process.hrtime(convertStart)
      // Recognize text of any language in any format
      const tesseractStart = process.hrtime()
      tesseract.process(tesseractInputFile, (err, text) => {
        const tesseractEnd = process.hrtime(tesseractStart)
        if (err) {
          console.error(err)
        } else {
          fs.unlink(restInputFile, (err) => {
            if (err) {
              res.status(500).json('Error while scanning image')
            }
            console.log('successfully deleted %s', restInputFile)
          })
          res.status(200).json({
            text: text,
            convertRuntime: convertEnd[0] * 1000 + convertEnd[1] / 1000000,
            tesseractRuntime: tesseractEnd[0] * 1000 + tesseractEnd[1] / 1000000
          })
        }
      })
    })
}

// setup express routes
const app = express()
app.use(express.static('public'))
app.post('/api/ocr', upload.single('files'), processRequest)

// start express
const runningPortNumber = process.env.PORT || 3001
const server = app.listen(runningPortNumber, () => {
  console.log('Example app listening at http://%s:%s', server.address().address, server.address().port)
})
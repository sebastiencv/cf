/**
 * Credit to https://github.com/minhajkk/mulkiya-ocr MIT
 */

const tesseract = require('node-tesseract')
const multer = require('multer')
const fs = require('fs')

const upload = multer({
  dest: './.tmp/',
  inMemory: false
})

module.exports = (app) => {
  app.post('/api/ocr', upload.single('files'), processRequest)
}

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
  const path = req.file.path
  const time = process.hrtime()
  // Recognize text of any language in any format
  tesseract.process(path, (err, text) => {
    const diff = process.hrtime(time)
    if (err) {
      console.error(err)
    } else {
      fs.unlink(path, (err) => {
        if (err) {
          res.status(500).json('Error while scanning image')
        }
        console.log('successfully deleted %s', path)
      })
      res.status(200).json({text: text, runtime: diff[0]*1000 + diff[1]/1000000})
    }
  })
}
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
  app.post("/api/ocr", upload.single('files'), process)
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
const process = (req, res) => {
  // console.log(req)
  const path = req.file.path
  // Recognize text of any language in any format
  tesseract.process(path, (err, text) => {
    if (err) {
      console.error(err)
    } else {
      fs.unlink(path, (err) => {
        if (err) {
          res.json(500, "Error while scanning image")
        }
        console.log('successfully deleted %s', path)
      })
      res.json(200, text);
    }
  })
}
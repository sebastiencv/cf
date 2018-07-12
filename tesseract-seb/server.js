/**
 * Credit to https://github.com/minhajkk/mulkiya-ocr MIT
 */

const express = require('express')

const app = express()

app.use(express.static('public'))

require('./routes')(app)

const runningPortNumber = process.env.PORT || 3001
const server = app.listen(runningPortNumber, () => {
  console.log('Example app listening at http://%s:%s', server.address().address, server.address().port)
})
const express = require('express')

// setup express routes
const app = express()
app.use(express.static('webapp'))
// start express
const runningPortNumber = process.env.PORT || 3001
const server = app.listen(runningPortNumber, () => {
  console.log('SimpleUI5app listening at http://%s:%s', server.address().address, server.address().port)
})
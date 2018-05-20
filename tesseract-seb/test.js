const express = require('express')
const app = express()
const serveIndex = require('serve-index')
const path = require('path')
const fs = require('fs-extra')
const proxy = require('http-proxy-middleware')
const tesseract = require('node-tesseract')
 
// provide folder and file browsing
app.get(/^\/.*/, serveIndex(path.join(__dirname, './')))
app.use(express.static(path.join(__dirname, './')))

var sys = require('sys')
var exec = require('child_process').exec;

var cmd = (cmdStr) => {
  exec(cmdStr, (error, stdout, stderr) => {
    console.log(`== command : ${cmdStr} ==`)
    console.log(`${stdout}`)
    if (stderr && stderr.length > 0) console.log(`stderr: ${stderr}`)
    if (error !== null) {
      console.error(`exec error: ${error}`)
    }
  });
}

cmd(`ls -la $LD_LIBRARY_PATH`)
cmd('echo $LD_LIBRARY_PATH')
cmd(`ls -la $TESSDATA_PREFIX`)
cmd('echo $TESSDATA_PREFIX')
cmd(`ls /home/vcap/deps/0/tesseract-ocr`)
cmd('echo $PATH')
cmd(`pwd`)

// tesseract processing
app.all('/tesseract', function (req, res, next) {
  console.log('Running tesseract ...')
  tesseract.process(__dirname + '/image.jpg',function(err, text) {
    if(err) {
        console.error(err)
        next() // pass control to the next handler
      } else {
        console.log(text)
        res.send(text) // pass control to the next handler
    }
  });
});
  
// Listen for requests
const port = process.env.PORT || 3001;
var server = app.listen(port, function() {
  var port = server.address().port;
  console.log(`Listen on port ${port}`);
  console.log(`Try http://localhost:${port}/`);
});
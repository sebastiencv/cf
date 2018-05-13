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

cmd(`lsb_release -a`)
cmd(`lscpu`)
cmd(`pwd`)
cmd(`ls /home/vcap/deps/0`)
cmd(`ls /home/vcap/deps/0/tesseract-ocr`)
cmd(`ls -la /home/vcap/deps/0/tesseract-ocr/lib`)
cmd('echo $PATH')
cmd('echo $LD_LIBRARY_PATH')
cmd('ls -la $LD_LIBRARY_PATH')
cmd('echo $TESSDATA_PREFIX')
cmd('printenv')

// tesseract processing
app.all('/tesseract', function (req, res, next) {
  console.log('Running tesseract ...')
  tesseract.process(__dirname + '/admin-Emergency-Contact.jpg',function(err, text) {
    if(err) {
        console.error(err)
        next() // pass control to the next handler
      } else {
        console.log(text)
        res.send(text) // pass control to the next handler
    }
  });
});
 
// add sapui5 resources location
let sapui5LocalResourcesRoot
try {
  sapui5LocalResourcesRoot = fs.readJsonSync('./destinations.json')['UI5-SDK']
} catch (e) {
  console.info('File destinations.json not found')
}
if (sapui5LocalResourcesRoot) {
  // a local ressource exists, use it (as static)
  app.use('/resources', express.static(path.join(sapui5LocalResourcesRoot, 'resources')))
  app.use('/test-resources', express.static(path.join(sapui5LocalResourcesRoot, 'test-resources')))
  console.log(`SAPUI5 resources provided from ${sapui5LocalResourcesRoot}`)
} else {
  // no local provided, use //sapui5.hana.ondemand.com (via proxy)
  const sapui5URLResourcesRoot = 'https://sapui5.hana.ondemand.com'
  app.use('/resources', proxy({
    target: sapui5URLResourcesRoot,
    proxyTimeout: 30000,
    secure: false,
    changeOrigin: true,
  }))
  app.use('/test-resources', proxy({
    target: sapui5URLResourcesRoot,
    proxyTimeout: 30000,
    secure: false,
    changeOrigin: true,
  }))
}
 
// setup redirect (destination) to northwind examples
app.use('/destinations/northwind', proxy({
  target: 'http://services.odata.org/(S(gmmpupyk2gc1rpss4hhnvij5))',
  pathRewrite: { '^/destinations/northwind': '' },
  proxyTimeout: 30000,
  secure: false,
  changeOrigin: true,
}))

// setup redirect (destination) to sap ml api
app.use('/ml', proxy({
  target: 'https://sandbox.api.sap.com',
  proxyTimeout: 30000,
  secure: true,
  changeOrigin: true,
}))

// setup redirect (destination) to SFSF OData
try {
  const sfInstance = fs.readJsonSync('./destinations.json')['SFPMIG000023']
  app.use('/odata', proxy({
    target: sfInstance.target,
    pathRewrite: path => {
      let rewritePath = path.replace(/^\/odata/, '')
      //if (path.includes('$metadata')) rewritePath = rewritePath.replace(/^\/\$metadata/, '/cust_adcFileCompensationLetter,Attachment/$metadata')
      if (path.includes('$metadata')) rewritePath = rewritePath.replace(/^\/\$metadata/, '/cust_adcTrackedFile,cust_adcPDFDated,cust_adcPDF,cust_adcPendingDoc,cust_adcRCMPendingDoc,cust_adcRCMPDF,Attachment/$metadata')
      return rewritePath
    },
    proxyTimeout: 30000,
    auth: sfInstance.auth,
    headers: { Accept: 'application/json,application/xml,plain/text' },
    secure: false,
    changeOrigin: true,
  }))
} catch(e) {
  console.info('File destinations.json not found')
}
 
// Listen for requests
const port = process.env.PORT || 3001;
var server = app.listen(port, function() {
  var port = server.address().port;
  console.log(`Listen on port ${port}`);
  console.log(`Try http://localhost:${port}/`);
});
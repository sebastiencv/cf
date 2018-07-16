
const tesseract = require('node-tesseract')

const exec = require('child_process').exec

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


// cmd('gs -dNOPAUSE -q -sDEVICE=tiff12nc -r300 -dBATCH -sOutputFile=image.tif 2p.pdf')
cmd('convert -density 300 2p.pdf -depth 8 -strip -background white -alpha off -append image.png')
  .then(() => {
    console.log('Running tesseract ...')
    tesseract.process(__dirname + '/image.png', function (err, text) {
      if (err) {
        console.error(err)
      } else {
        console.log(text)
      }
    })
  })
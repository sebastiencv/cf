#!/bin/sh
mkdir -p tesseract/bin
mkdir -p tesseract/lib
cp /usr/bin/tesseract tesseract/bin
cp /usr/lib/libtesseract.so.3 tesseract/lib
cp /usr/lib/liblept.so.4 tesseract/lib
cp /usr/lib/x86_64-linux-gnu/libstdc++.so.6 tesseract/lib
cp /usr/lib/x86_64-linux-gnu/libjpeg.so.8 tesseract/lib
cp /usr/lib/x86_64-linux-gnu/libgif.so.4 tesseract/lib
cp /usr/lib/x86_64-linux-gnu/libtiff.so.5 tesseract/lib
cp /usr/lib/x86_64-linux-gnu/libwebp.so.5 tesseract/lib
cp /usr/lib/x86_64-linux-gnu/libjbig.so.0 tesseract/lib
cd tesseract
tar -zcvf ../tesseract-ocr-3.03.tar.gz bin lib

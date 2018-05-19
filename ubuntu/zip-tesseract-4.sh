#!/bin/sh
mkdir -p tesseract-4/bin
mkdir -p tesseract-4/lib
cp /usr/bin/tesseract tesseract-4/bin
cp /usr/lib/x86_64-linux-gnu/libtesseract.so.4 tesseract-4/lib
cp /usr/lib/x86_64-linux-gnu/liblept.so.5 tesseract-4/lib
cp /usr/lib/x86_64-linux-gnu/libstdc++.so.6 tesseract-4/lib
cp /usr/lib/x86_64-linux-gnu/libgomp.so.1 tesseract-4/lib
cp /usr/lib/x86_64-linux-gnu/libjpeg.so.8 tesseract-4/lib
cp /usr/lib/x86_64-linux-gnu/libgif.so.4 tesseract-4/lib
cp /usr/lib/x86_64-linux-gnu/libtiff.so.5 tesseract-4/lib
cp /usr/lib/x86_64-linux-gnu/libwebp.so.5 tesseract-4/lib
cp /usr/lib/x86_64-linux-gnu/libopenjp2.so.7 tesseract-4/lib
cp /usr/lib/x86_64-linux-gnu/libjbig.so.0 tesseract-4/lib
	
cd tesseract-4
tar -zcvf ../tesseract-ocr-4.00.tar.gz bin lib

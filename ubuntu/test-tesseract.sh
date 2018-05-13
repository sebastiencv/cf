#!/bin/sh
tesseract image.jpg -l eng --tessdata-dir tesseract/tessdata/ out
cat out.txt
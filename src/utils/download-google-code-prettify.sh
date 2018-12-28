#!/bin/bash

wget https://github.com/google/code-prettify/archive/master.zip

unzip master.zip

TARGET=code-prettify-master/src/prettify.js

patch $TARGET prettify.js.diff

cat code-prettify-master/src/lang-*.js >> $TARGET

echo '

modules.exports = {
  prettyPrint,
  prettyPrintOne,
  langHandlerForExtension,
  PR,
};


' >> $TARGET

mv $TARGET .

rm -r code-prettify-master
rm master.zip

#!/bin/bash

cd dist/spa-mat

git init
git add .
git config user.name 'Yingyu Cheng'
git config user.email 'github@winguse.com'
git commit -a -m "release: `date`"
git push --force "https://$GH_TOKEN@github.com/winguse/approve.git" master:gh-pages


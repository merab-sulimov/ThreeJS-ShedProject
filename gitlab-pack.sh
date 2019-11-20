#!/usr/bin/env bash

PACKAGE="package"

mkdir $PACKAGE
cp -r build/js/ $PACKAGE/
cp -r build/img/ $PACKAGE/
cp -r build/models/ $PACKAGE/
cp -r build/fonts/ $PACKAGE/
cp -r build/css/ $PACKAGE/
cp -r build/shaders/ $PACKAGE/
cat build/index.html > $PACKAGE/test.html
cat build/assets.json > $PACKAGE/assets.json

ls -la $PACKAGE

tar -czvf ./build.tar.gz $PACKAGE/
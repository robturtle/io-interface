#!/bin/bash

cp ./node_modules/ts-transformer-interface/transformer.js ./transform-interface.js
cp ./node_modules/ts-transformer-interface/runtime-schema.js ./runtime-schema.js
tsc
npx pretty-quick

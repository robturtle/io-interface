#!/bin/bash

cp ./node_modules/ts-transformer-interface/transformer.js ./transform-interface.js
cp ./node_modules/ts-transformer-interface/runtime-schema.js ./runtime-schema.js
cp ./node_modules/ts-transformer-decoder-cast/transformer.js ./transform-request.js
tsc
npx pretty-quick

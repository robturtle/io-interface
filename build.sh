#!/bin/bash

cp ./node_modules/ts-transformer-interface/transformer.ts ./src/transform-interface.ts
cp ./node_modules/ts-transformer-interface/runtime-schema.ts ./src/runtime-schema.ts
cp ./node_modules/ts-transformer-decoder-cast/transformer.ts ./src/transform-request.ts

cp ./node_modules/ts-transformer-interface/transformer.js ./src/transform-interface.js
cp ./node_modules/ts-transformer-interface/runtime-schema.js ./src/runtime-schema.js
cp ./node_modules/ts-transformer-decoder-cast/transformer.js ./src/transform-request.js
tsc
npx pretty-quick

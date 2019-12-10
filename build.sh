#!/bin/bash

rm -rf lib/

cp ./node_modules/ts-transformer-interface/transformer.d.ts ./transform-interface.d.ts
cp ./node_modules/ts-transformer-interface/transformer.js ./transform-interface.js

cp ./node_modules/ts-transformer-interface/runtime-schema.d.ts ./runtime-schema.d.ts
cp ./node_modules/ts-transformer-interface/runtime-schema.js ./runtime-schema.js

cp ./node_modules/ts-transformer-decoder-cast/transformer.ts ./transform-request.ts

tsc
npx pretty-quick
cp ./runtime-schema.* lib/
cp ./transform-interface.* lib/
cp package.json lib/
cp README.md lib/

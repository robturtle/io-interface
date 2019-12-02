#!/bin/bash
# I'm so hxcking confused about the tsconfig, just do this quick hack here
rm -rf lib/

cp ./node_modules/ts-transformer-interface/transformer.ts ./src/transform-interface.ts
cp ./node_modules/ts-transformer-interface/runtime-schema.ts ./src/runtime-schema.ts
cp ./node_modules/ts-transformer-decoder-cast/transformer.ts ./src/transform-request.ts

cp ./node_modules/ts-transformer-interface/transformer.js ./src/transform-interface.js
cp ./node_modules/ts-transformer-interface/runtime-schema.js ./src/runtime-schema.js
cp ./node_modules/ts-transformer-decoder-cast/transformer.js ./src/transform-request.js

tsc

cp ./node_modules/ts-transformer-interface/transformer.ts ./lib/transform-interface.ts
cp ./node_modules/ts-transformer-interface/runtime-schema.ts ./lib/runtime-schema.ts
cp ./node_modules/ts-transformer-decoder-cast/transformer.ts ./lib/transform-request.ts

cp lib/index.d.ts src

npx pretty-quick

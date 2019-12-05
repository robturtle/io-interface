#!/bin/bash

cp ./node_modules/ts-transformer-interface/transformer.ts ./transform-interface.ts
cp ./node_modules/ts-transformer-interface/runtime-schema.ts ./runtime-schema.ts
cp ./node_modules/ts-transformer-decoder-cast/transformer.ts ./transform-request.ts

cat runtime-schema.ts | sed 's/index.d/index/' > replaced
mv replaced runtime-schema.ts

tsc
npx pretty-quick
cp package.json lib/

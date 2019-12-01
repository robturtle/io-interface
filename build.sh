#!/bin/bash

cp ./node_modules/ts-transformer-interface/transformer.ts ./transform-interface.ts
cp ./node_modules/ts-transformer-interface/runtime-schema.ts ./runtime-schema.ts
tsc

import { compile } from '../../src/compiler';
import * as path from 'path';

compile([path.join(__dirname, '../sample.ts')]);

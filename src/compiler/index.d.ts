import * as ts from 'typescript';
import transformInterface from '../transform-interface';
/** @since 1.4.0 */
export { default as transformInterface } from '../transform-interface';
/** @since 1.4.0 */
export { default as transformRequest } from '../transform-request';
/**
 * Should only use it for testing.
 * @since 1.4.0
 * @example
 * // compile to 'test.js'
 * const compile = compilerFactory([transformInterface, transformRequest])
 * compile([path.join(__dirname, 'test.ts')])
 */
export declare function compilerFactory(
  transforms: Array<typeof transformInterface>,
): (filePaths: string[], writeFileCallback?: ts.WriteFileCallback | undefined) => void;
/**
 * Should only use it for testing.
 * @since 1.4.0
 * @example
 * // compile to 'test.js'
 * compile([path.join(__dirname, 'test.ts')])
 */
export declare const compile: (
  filePaths: string[],
  writeFileCallback?: ts.WriteFileCallback | undefined,
) => void;

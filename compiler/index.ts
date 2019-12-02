import * as ts from 'typescript';
import transformInterface from '../transform-interface';
import transformRequest from '../transform-request';

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
export function compilerFactory(transforms: Array<typeof transformInterface>) {
  return function(filePaths: string[], writeFileCallback?: ts.WriteFileCallback): void {
    const program = ts.createProgram(filePaths, {
      strict: true,
      noEmitOnError: true,
      suppressImplicitAnyIndexErrors: true,
      target: ts.ScriptTarget.ES5,
    });
    const transformers: ts.CustomTransformers = {
      before: transforms.map(tr => tr(program)),
      after: [],
    };
    const { emitSkipped, diagnostics } = program.emit(
      undefined,
      writeFileCallback,
      undefined,
      false,
      transformers,
    );
    if (emitSkipped) {
      throw new Error(diagnostics.map(diagnostic => diagnostic.messageText).join('\n'));
    }
  };
}

/**
 * Should only use it for testing.
 * @since 1.4.0
 * @example
 * // compile to 'test.js'
 * compile([path.join(__dirname, 'test.ts')])
 */
export const compile = compilerFactory([transformInterface, transformRequest]);

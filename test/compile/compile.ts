import * as ts from 'typescript';
import transformInterface from '../../transform-interface';
import transformRequest from '../../transform-request';

export function compile(filePaths: string[], writeFileCallback?: ts.WriteFileCallback): void {
  const program = ts.createProgram(filePaths, {
    strict: true,
    noEmitOnError: true,
    suppressImplicitAnyIndexErrors: true,
    target: ts.ScriptTarget.ES5,
  });
  const transformers: ts.CustomTransformers = {
    before: [transformInterface(program), transformRequest(program)],
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
}

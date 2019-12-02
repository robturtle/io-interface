import * as ts from 'typescript';
import * as path from 'path';

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) =>
    visitNodeAndChildren(file, program, context);
}

function visitNodeAndChildren(
  node: ts.SourceFile,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.SourceFile;

function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.Node;

function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.Node {
  return ts.visitEachChild(
    visitNode(node, program),
    child => visitNodeAndChildren(child, program, context),
    context,
  );
}

function visitNode(node: ts.Node, program: ts.Program): ts.Node {
  const typeChecker = program.getTypeChecker();
  if (!isCastCallExpression(node, typeChecker)) {
    return node;
  }
  if (!node.typeArguments || node.typeArguments.length === 0) {
    return node;
  } else {
    const args = node.arguments;
    const expression = node.getText();
    const match = /(.*)\.requestAndCast/.exec(expression);
    if (!match || !match[1]) {
      return node;
    }
    const caller = match[1];
    const typeArgNode = node.typeArguments[0];
    const typeArgType = typeChecker.getTypeFromTypeNode(typeArgNode);
    const typeArgName = typeArgType.symbol.getName();
    if (typeArgName === 'Array') {
      const elementType = (typeArgNode as any).elementType;
      if (!elementType) {
        return node;
      }
      const elementTypeName = elementType.typeName.getText();
      return ts.createRegularExpressionLiteral(
        `${caller}.request(${argsText(args)}, ${cb('decodeArray', elementTypeName)})`,
      );
    } else {
      return ts.createRegularExpressionLiteral(
        `${caller}.request(${argsText(args)}, ${cb('decode', typeArgName)})`,
      );
    }
  }
}

function argsText(args: ts.NodeArray<ts.Expression>): string {
  return args.map(a => a.getText()).join(', ');
}

function cb(func: string, elementTypeName: string): string {
  return `function(c,d,e) { return c.${func}('${elementTypeName}', d,e) }`;
}

const indexTs = path.join(__dirname, 'index.d.ts');

function isCastCallExpression(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  const signature = typeChecker.getResolvedSignature(node);
  if (signature === undefined) {
    return false;
  }
  const { declaration } = signature;
  return (
    !!declaration &&
    !ts.isJSDocSignature(declaration) &&
    // path.join(declaration.getSourceFile().fileName) === indexTs &&
    !!declaration.name &&
    declaration.name.getText() === 'requestAndCast'
  );
}

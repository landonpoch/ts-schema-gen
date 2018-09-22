import {
    SyntaxKind,
    Node,
    CompilerOptions,
    createProgram,
    ScriptTarget,
    ModuleKind,
    isVariableStatement,
    isInterfaceDeclaration,
    isTypeAliasDeclaration,
} from "typescript";
import { createWriter } from "./utils";
import { emitPackageDeclaration, emitInterface, emitAlias } from "./emitter";

global.lkp = (kind: SyntaxKind): string => SyntaxKind[kind];

const codeGen = (fileNames: string[], options: CompilerOptions) => {
    const program = createProgram(fileNames, options);
    const files = program.getSourceFiles().filter(f => fileNames.includes(f.fileName));
    const checker = program.getTypeChecker();
    files.forEach(file => {
        const writer = createWriter();

        // see: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
        // see: https://basarat.gitbooks.io/typescript/docs/compiler/ast.html
        // see: https://en.wikipedia.org/wiki/Abstract_syntax_tree
        const walk = (node: Node): void => {
            if (isVariableStatement(node)) emitPackageDeclaration(node, writer);
            if (isTypeAliasDeclaration(node)) emitAlias(node, writer, checker);
            if (isInterfaceDeclaration(node)) emitInterface(node, writer, checker);
            node.forEachChild(walk);
        }
        
        walk(file);
        writer.toConsole();
    });
}

codeGen(process.argv.slice(2), {
    noEmitOnError: true,
    noImplicitAny: true,
    target: ScriptTarget.ES2015,
    module: ModuleKind.CommonJS,
});
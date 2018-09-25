import {
    SyntaxKind,
    Node,
    CompilerOptions,
    createProgram,
    ScriptTarget,
    ModuleKind,
    isVariableStatement,
    isTypeAliasDeclaration,
    isClassDeclaration,
    // isImportDeclaration,
    // isImportSpecifier,
    // isIdentifier,
    // isNamedImports,
    // isTypeNode,
} from "typescript";
import { createWriter } from "./utils";
import { emitPackageDeclaration, emitClass, emitAlias } from "./emitter";

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
            // printAllChildren(node);
            // TODO: Eventually we may want to support importing from other files, if so, this code becomes necessary.
            // if (isImportDeclaration(node) && !!node.importClause && !!node.importClause.namedBindings) {
            //     node.importClause.namedBindings.forEachChild(c => {
            //         if (isImportSpecifier(c)) {
            //             const type = checker.getTypeAtLocation(c);
            //             const name = type.symbol.name;
            //             if (!!type.symbol.members) {
            //                 debugger;
            //             }
            //         }
            //     });
            // }
            if (isVariableStatement(node)) emitPackageDeclaration(node, writer);
            if (isTypeAliasDeclaration(node)) emitAlias(node, writer, checker);
            if (isClassDeclaration(node)) emitClass(node, writer, checker);
            node.forEachChild(walk);
        }
        
        walk(file);
        
        // writer.toConsole();
        const gofilename = file.fileName.slice(0, file.fileName.length - 2) + "go"
        writer.toFile(file.fileName, gofilename);
        console.log(`Successfully generated go file: ${gofilename}`);
    });
}

function printAllChildren(node: Node, depth = 0) {
    console.log(new Array(depth+1).join('----'), global.lkp(node.kind), node.pos, node.end);
    depth++;
    node.getChildren().forEach(c=> printAllChildren(c, depth));
}

codeGen(process.argv.slice(2), {
    noEmitOnError: true,
    noImplicitAny: true,
    target: ScriptTarget.ES2015,
    module: ModuleKind.CommonJS,
});
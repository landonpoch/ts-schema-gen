import fs from "fs";
import { each, map, filter, includes, camelCase } from "lodash";
import {
    SyntaxKind,
    Node,
    CompilerOptions,
    createProgram,
    ScriptTarget,
    ModuleKind,
    isVariableStatement,
    isVariableDeclaration,
    isIdentifier,
    isStringLiteral,
    isInterfaceDeclaration,
    isPropertySignature,
    isTypeReferenceNode,
    isLiteralTypeNode,
    isArrayTypeNode,
    isUnionTypeNode,
    isTypeAliasDeclaration,
} from "typescript";
global.lkp = (kind: SyntaxKind): string => SyntaxKind[kind];

const pascalCase = (val: string): string =>
    (camel => camel.charAt(0).toUpperCase() + camel.slice(1))
        (camelCase(val));

const getLiteralType = (kind: SyntaxKind): string => {
    switch (kind) {
        case SyntaxKind.FalseKeyword:
        case SyntaxKind.TrueKeyword:
            return "bool";
        case SyntaxKind.NumberKeyword:
        case SyntaxKind.NumericLiteral:
            return "float64"; // TODO: default to widest numeric type?
        case SyntaxKind.StringKeyword:
        case SyntaxKind.StringLiteral:
            return "string";
        default:
            debugger;
            throw `Unable to parse literal type: ${global.lkp(kind)}`;
    }
}

const boolAliases = ['bool']
const numAliases = [
    'int',
    'int8',
    'int16',
    'int32',
    'int64',
    'uint',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'float32',
    'float64',
    'byte',
    'rune'
];



const codeGen = (fileNames: string[], options: CompilerOptions) => {
    const program = createProgram(fileNames, options);
    const files = filter(program.getSourceFiles(), f => includes(fileNames, f.fileName));
    const checker = program.getTypeChecker();
    each(files, file => {
        let emit = "";

        // see: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
        // see: https://basarat.gitbooks.io/typescript/docs/compiler/ast.html
        // see: https://en.wikipedia.org/wiki/Abstract_syntax_tree
        // Also, sounds like the visitor pattern might be an option for more flexibility for plugin stuff
        const walk = (node: Node): void => {
            // Traverse|Recurse types
            if (node.kind === SyntaxKind.SyntaxList ||
                node.kind === SyntaxKind.SourceFile) {
                map(node.getChildren(), c => walk(c));
                return;
            }

            if (isVariableStatement(node)) {
                const declarations = node.declarationList.declarations
                each(declarations, declaration => {
                    if (isVariableDeclaration(declaration)) {
                        const name = declaration.name;
                        const initializer = declaration.initializer;
                        if (isIdentifier(name) &&
                            name.text === "go_package" &&
                            !!initializer &&
                            isStringLiteral(initializer)) {
                            emit += `package ${initializer.text}\n\n`
                        }
                    }
                });
                return;
            }

            // Interfaces
            if (isInterfaceDeclaration(node)) {
                emit += `type ${node.name.text} struct {\n`;
                each(node.members, member => {
                    if (isPropertySignature(member)) {
                        const nullable = !!member.questionToken;
                        const name = member.name;
                        if (isIdentifier(name)) {
                            const propName = name.text;
                            if (member.type) {
                                let propType = "";
                                let typeNode = member.type;
                                if (typeNode.kind === SyntaxKind.BooleanKeyword) {
                                    propType = "bool"; // boolean should be assumed bool for golang
                                }
                                if (typeNode.kind === SyntaxKind.NumberKeyword) {
                                    propType = "float64"; // number should be assumed float64 for golang   
                                }
                                if (typeNode.kind === SyntaxKind.StringKeyword) {
                                    propType = "string";
                                }
                                if (isTypeReferenceNode(typeNode)) {
                                    const typeName = typeNode.typeName;
                                    if (isIdentifier(typeName)) {
                                        propType = typeName.text;
                                    }
                                }
                                if (isLiteralTypeNode(typeNode)) {
                                    propType = getLiteralType(typeNode.literal.kind)
                                }
                                if (isArrayTypeNode(typeNode)) {
                                    const elementType = typeNode.elementType;
                                    let baseType = "";
                                    if (elementType.kind === SyntaxKind.BooleanKeyword) {
                                        baseType = "bool";
                                    }
                                    if (elementType.kind === SyntaxKind.NumberKeyword) {
                                        baseType = "float64";
                                    }
                                    if (elementType.kind === SyntaxKind.StringKeyword) {
                                        baseType = "string";
                                    }
                                    if (isLiteralTypeNode(elementType)) {
                                        baseType = getLiteralType(elementType.literal.kind);
                                    }
                                    if (isTypeReferenceNode(elementType)) {
                                        const typeName = elementType.typeName;
                                        if (isIdentifier(typeName)) {
                                            baseType = typeName.text;
                                        }
                                    }
                                    // Array of array
                                    propType = baseType === "" ? "" : `[]${baseType}`
                                }
                                if (isUnionTypeNode(typeNode)) {
                                    // TODO: Think about what this means in golang... object aggregator, interface{}?
                                    let initialType = "";
                                    let aggregatable = true;
                                    each(typeNode.types, tn => {
                                        if (tn.kind === SyntaxKind.BooleanKeyword) {
                                            initialType = initialType || "bool";
                                            aggregatable = initialType === "bool";
                                        }
                                        if (tn.kind === SyntaxKind.NumberKeyword) {
                                            initialType = initialType || "float64";
                                            aggregatable = initialType === "float64";
                                        }
                                        if (tn.kind === SyntaxKind.StringKeyword) {
                                            initialType = initialType || "string";
                                            aggregatable = initialType === "string";
                                        }
                                        if (isTypeReferenceNode(tn)) {
                                            if (propName === "my_int_rune_union") debugger;
                                            const typeName = tn.typeName;
                                            if (isIdentifier(typeName)) {
                                                let golangType = "";
                                                if (includes(boolAliases, typeName.text)) {
                                                    golangType = "bool";
                                                }
                                                if (includes(numAliases, typeName.text)) {
                                                    golangType = "float64";
                                                }
                                                initialType = initialType || golangType || typeName.text;
                                                aggregatable = initialType === (golangType || typeName.text);
                                            }
                                        }
                                        if (isLiteralTypeNode(tn)) {
                                            const literalType = getLiteralType(tn.literal.kind);
                                            initialType = initialType || literalType;
                                            aggregatable = initialType === literalType;
                                        }
                                        if (isArrayTypeNode(tn)) {
                                            const elementType = tn.elementType;
                                            let baseType = "";
                                            if (elementType.kind === SyntaxKind.BooleanKeyword) {
                                                baseType = "bool";
                                            }
                                            if (elementType.kind === SyntaxKind.NumberKeyword) {
                                                baseType = "float64";
                                            }
                                            if (elementType.kind === SyntaxKind.StringKeyword) {
                                                baseType = "string";
                                            }
                                            if (isLiteralTypeNode(elementType)) {
                                                baseType = getLiteralType(elementType.literal.kind)
                                            }
                                            if (isTypeReferenceNode(elementType)) {
                                                const typeName = elementType.typeName;
                                                if (isIdentifier(typeName)) {
                                                    baseType = typeName.text;
                                                }
                                            }
                                            // Array of array
                                            // propType = baseType === "" ? "" : `[]${baseType}`
                                        }
                                    });
                                    propType = aggregatable ? initialType : "interface{}";
                                }
                                if (propType === "") {
                                    debugger;
                                }
                                // TODO: Property alignment formatting now, or post emit generation.
                                emit += `    ${pascalCase(propName)} ${propType} \`json:"${propName}${nullable ? ",omitempty" : ""}"\`\n`
                            }
                        }
                    }
                });
                emit += "}\n\n";
                return;
            }

            // Non-emit types
            if (node.kind === SyntaxKind.EndOfFileToken ||
                isTypeAliasDeclaration(node))
                return;

            debugger;
            throw `Unhandled syntax kind: ${node.kind}`;
        }
        walk(file);
        console.log(emit);
    });
}

codeGen(process.argv.slice(2), {
    noEmitOnError: true,
    noImplicitAny: true,
    target: ScriptTarget.ES2015,
    module: ModuleKind.CommonJS,
});
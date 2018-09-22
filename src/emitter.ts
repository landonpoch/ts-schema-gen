import {
    SyntaxKind,
    TypeChecker,
    VariableStatement,
    isVariableDeclaration,
    isIdentifier,
    isStringLiteral,
    isPropertySignature,
    isTypeReferenceNode,
    isLiteralTypeNode,
    isArrayTypeNode,
    isUnionTypeNode,
    InterfaceDeclaration,
} from "typescript";
import { Writer, pascalCase } from "./utils";

const boolAliases = ['bool']
const numAliases = ['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 'float64', 'byte', 'rune'];

// TODO: This looks like a bad pattern.  Work towards moving everything into a visitor pattern instead.
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

const emitGoPackage = (node: VariableStatement, writer: Writer): void => {
    const declarations = node.declarationList.declarations
    declarations.forEach(declaration => {
        if (isVariableDeclaration(declaration)) {
            const name = declaration.name;
            const initializer = declaration.initializer;
            if (isIdentifier(name) &&
                name.text === "go_package" &&
                !!initializer &&
                isStringLiteral(initializer)) {
                writer.write(`package ${initializer.text}\n\n`);
            }
        }
    });
}

// TypeScript Interfaces -> Golang structs
const emitStruct = (node: InterfaceDeclaration, writer: Writer, checker: TypeChecker): void => {
    writer.write(`type ${node.name.text} struct {\n`);
    node.members.forEach(member => {
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
                        typeNode.types.forEach(tn => {
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
                                // if (propName === "my_int_rune_union") debugger;
                                const typeName = tn.typeName;
                                if (isIdentifier(typeName)) {
                                    let golangType = "";
                                    if (boolAliases.includes(typeName.text)) {
                                        golangType = "bool";
                                    } else if (numAliases.includes(typeName.text)) {
                                        golangType = "float64";
                                    } else {
                                        const details = checker.getSymbolAtLocation(typeName);
                                        if (details && details.members) {
                                            // debugger; // TODO: work on union types
                                            // details.members
                                        }
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
                    writer.write(`    ${pascalCase(propName)} ${propType} \`json:"${propName}${nullable ? ",omitempty" : ""}"\`\n`);
                }
            }
        }
    });
    writer.write("}\n\n");
}

export { emitGoPackage, emitStruct }
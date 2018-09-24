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
    TypeNode,
    LiteralTypeNode,
    UnionTypeNode,
    ArrayTypeNode,
    TypeReferenceNode,
    TypeAliasDeclaration,
    UnderscoreEscapedMap,
    Symbol,
} from "typescript";
import { Writer, pascalCase } from "./utils";

const boolAliases = ['bool']
const numAliases = ['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64',
    'float32', 'float64', 'byte', 'rune'];
const golangPrimitives = ['string'].concat(numAliases).concat(boolAliases);

const getLiteralTypeName = (typeNode: LiteralTypeNode, writer: Writer): string => {
    switch (typeNode.literal.kind) {
        case SyntaxKind.FalseKeyword:
        case SyntaxKind.TrueKeyword:
            return "bool";
        case SyntaxKind.NumericLiteral:
            return "float64";
        case SyntaxKind.StringLiteral:
            return "string";
        default:
            writer.toConsole();
            throw `Unable to parse literal type name: ${global.lkp(typeNode.literal.kind)}`;
    }
}

const getTypeName = (typeNode: TypeNode, checker: TypeChecker, writer: Writer): string => {
    if (isUnionTypeNode(typeNode)) {
        return getUnionTypeName(typeNode, checker, writer);
    }
    if (isArrayTypeNode(typeNode)) {
        return getArrayTypeName(typeNode, checker, writer);
    }
    if (isTypeReferenceNode(typeNode)) {
        return getReferenceTypeName(typeNode, writer);
    }
    if (isLiteralTypeNode(typeNode)) {
        return getLiteralTypeName(typeNode, writer);
    }
    return getScalarTypeName(typeNode, writer);
}

const getScalarTypeName = (typeNode: TypeNode, writer: Writer): string => {
    switch (typeNode.kind) {
        case SyntaxKind.BooleanKeyword:
            return "bool";
        case SyntaxKind.NumberKeyword:
            return "float64";
        case SyntaxKind.StringKeyword:
            return "string";
        case SyntaxKind.AnyKeyword:
        case SyntaxKind.UnknownKeyword:
        case SyntaxKind.ObjectKeyword:
        case SyntaxKind.SymbolKeyword:
        case SyntaxKind.ThisKeyword:
        case SyntaxKind.VoidKeyword:
        case SyntaxKind.UndefinedKeyword:
        case SyntaxKind.NullKeyword:
            return "interface{}";
        case SyntaxKind.NeverKeyword:
        default:
            writer.toConsole();
            throw `Unable to parse scalar type name: ${global.lkp(typeNode.kind)}`;
    }
}

const getReferenceTypeName = (typeNode: TypeReferenceNode, writer: Writer): string => {
    const typeName = typeNode.typeName;
    if (isIdentifier(typeName)) {
        return typeName.text;
    }
    writer.toConsole();
    throw `Unable to parse reference type name: ${global.lkp(typeNode.kind)}`
}

const getArrayTypeName = (typeNode: ArrayTypeNode, checker: TypeChecker, writer: Writer): string => {
    const elementType = typeNode.elementType;
    const baseType = getTypeName(elementType, checker, writer);
    return `[]${baseType}`
}

const getUnionTypeName = (node: UnionTypeNode, checker: TypeChecker, writer: Writer): string => {    
    const stuff = node.types.reduce<Members | undefined>((accumulator, tn) => {
        if (isTypeReferenceNode(tn)) {
            const typeName = tn.typeName;
            if (isIdentifier(typeName)) {
                const details = checker.getSymbolAtLocation(typeName);
                if (details && details.members) {
                    if (!accumulator) {
                        let initial: Members = {};
                        details.members.forEach(m => {
                            const valueDeclaration = m.valueDeclaration;
                            if (isPropertySignature(valueDeclaration) && !!valueDeclaration.type) {
                                initial[m.name] = {
                                    required: !valueDeclaration.questionToken,
                                    type: getTypeName(valueDeclaration.type, checker, writer),
                                };
                            }
                        });
                        return initial;
                    } else {
                        details.members.forEach(m => {
                            const valueDeclaration = m.valueDeclaration;
                            if (isPropertySignature(valueDeclaration) && !!valueDeclaration.type) {
                                if (!accumulator.hasOwnProperty(m.name)) {
                                    accumulator[m.name] = {
                                        required: false,
                                        type: getTypeName(valueDeclaration.type, checker, writer),
                                    };
                                } else {

                                }
                            }
                        });
                    }
                }
            }
        }
        return undefined;
    }, undefined);
    return "ERROR"
}

const emitPackageDeclaration = (node: VariableStatement, writer: Writer): void => {
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

interface Members {
    [key: string]: {
        required: boolean;
        type: string;
    }
}

const emitInterface = (node: InterfaceDeclaration, writer: Writer, checker: TypeChecker): void => {
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
                    propType = getTypeName(typeNode, checker, writer);
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

// Any aliases that aren't primitive golang types need to be emitted.
// They are most likely referenced elsewhere and need definition.
const emitAlias = (node: TypeAliasDeclaration, writer: Writer, checker: TypeChecker): void => {
    // debugger;
    const name = node.name;
    if (isIdentifier(name)) {

        // don't emit alias if it is a primitive golang type
        if (boolAliases.includes(name.text) || numAliases.includes(name.text))
            return;

        const type = node.type;
        if (isTypeReferenceNode(type)) {
            const typeName = type.typeName;
            if (isIdentifier(typeName)) {
                writer.write(`type ${name.text} = ${typeName.text}\n\n`);
            }
        }
        
        if (isUnionTypeNode(type)) {
                let initialType = "";
                let aggregatable = true;
                let unionedTypes: Members[] = [];
                type.types.forEach(tn => {
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
                                    let unionedType: Members = {};
                                    details.members.forEach(m => {
                                        const valueDeclaration = m.valueDeclaration;
                                        if (isPropertySignature(valueDeclaration) && !!valueDeclaration.type) {
                                            unionedType[m.name] = {
                                                required: !valueDeclaration.questionToken,
                                                type: getTypeName(valueDeclaration.type, checker, writer),
                                            }
                                        }
                                    });
                                    unionedTypes.push(unionedType);
                                }
                            }
                            initialType = initialType || golangType || typeName.text;
                            if (["bool", "float64"].includes(golangType)) { // primitive
                                aggregatable = initialType === golangType;
                            }
                        }
                    }
                });
                if (!aggregatable) {
                    writer.write(`type ${name.text} = interface{}\n`);
                }
                if (aggregatable) {
                    if (unionedTypes.length > 1) {
                        const flattened = flattenUnion(unionedTypes);                        
                        writer.write(`type ${name.text} struct {\n`);
                        const keys = Object.keys(flattened);
                        keys.forEach(k => {
                            writer.write(`    ${pascalCase(k)} ${flattened[k].type} \`json:"${k}${flattened[k].required ? "" : ",omitempty"}"\`\n`)
                        });
                        writer.write("}\n\n");
                    } else {
                        writer.write(`type ${name.text} = ${initialType}\n`);
                    }
                }
        }
    }
}

// Takes an array of types which are being unioned together, and flattens them into one object
// with optional properties if not all unioned types contain the same member.
const flattenUnion = (unionedTypes: Members[]): Members => {
    return unionedTypes.reduce((flattened: Members, currentType: Members) => {
        const existingKeys = Object.keys(flattened);
        const currentKeys = Object.keys(currentType);
        const unmatchedKeys = existingKeys.filter(k => !currentKeys.includes(k));
        unmatchedKeys.forEach(k => { flattened[k].required = false; });
        return Object.keys(currentType).reduce((_, memberName: string) => {
            const memberType = currentType[memberName];
            flattened[memberName] = {
                required: !!flattened[memberName] && flattened[memberName].required && memberType.required,
                type: !!flattened[memberName]
                    ? flattened[memberName].type === memberType.type ? memberType.type : "interface{}"
                    : memberType.type,
            };
            return flattened;
        }, flattened);
    });
}

export { emitPackageDeclaration, emitInterface, emitAlias }
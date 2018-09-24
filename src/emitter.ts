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
    isPropertyDeclaration,
    ClassDeclaration,
    TypeNode,
    LiteralTypeNode,
    ArrayTypeNode,
    TypeReferenceNode,
    TypeAliasDeclaration,
    Identifier,
} from "typescript";
import { Writer, pascalCase } from "./utils";

const boolAliases = ['bool']
const numAliases = ['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 'float64', 'byte', 'rune'];
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
        return "interface{}"; // Inlined union types will be interpreted as interface. See docs on union types.
    }
    if (isArrayTypeNode(typeNode)) {
        return getArrayTypeName(typeNode, checker, writer);
    }
    if (isTypeReferenceNode(typeNode)) {
        return getReferenceTypeName(typeNode, checker, writer);
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

const getReferenceTypeName = (typeNode: TypeReferenceNode, checker: TypeChecker, writer: Writer): string => {
    const typeName = typeNode.typeName;
    if (isIdentifier(typeName)) {
        // TODO: Special case logic for golang pointers but will probably need to be extended for generics
        if (typeName.text === "Ptr" && !!typeNode.typeArguments && typeNode.typeArguments.length === 1) {
            const genericType = typeNode.typeArguments[0];
            return `*${getTypeName(genericType, checker, writer)}`;
        }
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

const emitClass = (node: ClassDeclaration, writer: Writer, checker: TypeChecker): void => {
    if (!!node.name) {
        writer.write(`type ${node.name.text} struct {\n`);
        let members: Members = {};
        node.members.forEach(member => {
            if (isPropertyDeclaration(member)) {
                const nullable = !!member.questionToken;
                const name = member.name;
                if (isIdentifier(name)) {
                    const propName = name.text;
                    if (member.type) {
                        let propType = "";
                        let typeNode = member.type;
                        propType = getTypeName(typeNode, checker, writer);
                        members[propName] = {
                            required: !nullable,
                            type: propName,
                        };
                    }
                }
            }
        });

        const keys = Object.keys(members);
        const keyLength = keys.reduce((agg, k) => agg < k.length ? k.length : agg, 0);
        const typeLength = keys.reduce((agg, k) => agg < members[k].type.length ? members[k].type.length : agg, 0);        
        keys.forEach(k => {
            writer.write(`    ${pascalCase(k).padEnd(keyLength)} ${members[k].type.padEnd(typeLength)} \`json:"${k}${members[k].required ? "" : ",omitempty"}"\`\n`);
        })
        writer.write("}\n\n");
    }
}

// Any aliases that aren't primitive golang types need to be emitted.
// They are most likely referenced elsewhere and need definition.
const emitAlias = (node: TypeAliasDeclaration, writer: Writer, checker: TypeChecker): void => {
    const name = node.name;
    if (isIdentifier(name)) {
        // don't emit alias if it is a primitive golang type (int, int8, int16, etc...)
        // things things already exist in golang and they are primitives, not type aliases.
        if (name.text === "Ptr" || boolAliases.includes(name.text) || numAliases.includes(name.text)) return;

        const type = node.type;
        if (isLiteralTypeNode(type)) {
            switch (type.literal.kind) {
                case SyntaxKind.FalseKeyword:
                case SyntaxKind.TrueKeyword:
                    writer.write(`type ${name.text} = bool\n`);
                    break;
                case SyntaxKind.NumericLiteral:
                    writer.write(`type ${name.text} = float64\n`);
                    break;
                case SyntaxKind.StringLiteral:
                    writer.write(`type ${name.text} = string\n`);
                    break;
            }
        }
        
        if (isTypeReferenceNode(type)) {
            const typeName = type.typeName;
            if (isIdentifier(typeName)) writer.write(`type ${name.text} = ${typeName.text}\n\n`);
        }
        
        if (isUnionTypeNode(type)) {
                let initialType = "";
                let canAggregate = true;
                let unionedTypes: Members[] = [];
                type.types.forEach(tn => {
                    // If you can't aggregate the union types just bail, it's going to be interface{} regardless
                    if (!canAggregate) return;

                    if (tn.kind === SyntaxKind.BooleanKeyword) {
                        initialType = initialType || "bool";
                        canAggregate = initialType === "bool";
                    }
                    if (tn.kind === SyntaxKind.NumberKeyword) {
                        initialType = initialType || "float64";
                        canAggregate = initialType === "float64";
                    }
                    if (tn.kind === SyntaxKind.StringKeyword) {
                        initialType = initialType || "string";
                        canAggregate = initialType === "string";
                    }
                    
                    if (isLiteralTypeNode(tn)) {
                        switch (tn.literal.kind) {
                            case SyntaxKind.FalseKeyword:
                            case SyntaxKind.TrueKeyword:
                                initialType = initialType || "bool";
                                canAggregate = initialType === "bool";
                                break;
                            case SyntaxKind.NumericLiteral:
                                initialType = initialType || "float64";
                                canAggregate = initialType === "float64";
                                break;
                            case SyntaxKind.StringLiteral:
                                initialType = initialType || "string";
                                canAggregate = initialType === "string";
                                break;
                        }
                    }

                    if (isTypeReferenceNode(tn)) {
                        const typeName = tn.typeName;
                        if (isIdentifier(typeName)) {
                            if (boolAliases.includes(typeName.text)) {
                                initialType = initialType || "bool";
                                canAggregate = initialType === "bool";
                            } else if (numAliases.includes(typeName.text)) {
                                initialType = initialType || "float64";
                                canAggregate = initialType === "float64";
                            } else {
                                initialType = initialType || typeName.text;
                                canAggregate = !golangPrimitives.includes(initialType);
                                if (canAggregate) {
                                    const typeDetails = getTypeDetails(checker, writer, typeName);
                                    if (!!typeDetails) unionedTypes.push(typeDetails);
                                }
                            }
                        }
                    }

                    if (isArrayTypeNode(tn)) {
                        canAggregate = false;
                    }
                });
                if (canAggregate) {
                    if (unionedTypes.length > 1) {
                        const flattened = flattenUnion(unionedTypes);                        
                        writer.write(`type ${name.text} struct {\n`);
                        const keys = Object.keys(flattened);
                        // TODO: Key length doesn't take into account pascalCase transformation
                        const keyLength = keys.reduce((agg, k) => agg < k.length ? k.length : agg, 0);
                        const typeLength = keys.reduce((agg, k) => agg < flattened[k].type.length ? flattened[k].type.length : agg, 0);
                        keys.forEach(k => {
                            writer.write(`    ${pascalCase(k).padEnd(keyLength)} ${flattened[k].type.padEnd(typeLength)} \`json:"${k}${flattened[k].required ? "" : ",omitempty"}"\`\n`)
                        });
                        writer.write("}\n\n");
                    } else {
                        writer.write(`type ${name.text} = ${initialType}\n`);
                    }
                } else {
                    writer.write(`type ${name.text} = interface{}\n`);
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

const getTypeDetails = (checker: TypeChecker, writer: Writer, identifier: Identifier): Members | undefined => {
    const details = checker.getSymbolAtLocation(identifier);
    if (details && details.members) {
        let typeDetails: Members = {};
        details.members.forEach(m => {
            const valueDeclaration = m.valueDeclaration;
            if (isPropertySignature(valueDeclaration) && !!valueDeclaration.type) {
                typeDetails[m.name] = {
                    required: !valueDeclaration.questionToken,
                    type: getTypeName(valueDeclaration.type, checker, writer),
                }
            }
        });
        return typeDetails
    }
    return undefined;
}

export { emitPackageDeclaration, emitClass, emitAlias }
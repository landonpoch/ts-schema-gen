export interface Struct {
    name: string;
    members: Members;
}

export interface Members {
    [key: string]: {
        required: boolean;
        type: string;
    }
}

interface StructMember {
    golangName: string;
    typeName: string;
    jsonName: string;
    required: boolean;
}

export interface Writer {
    write(text: string): void;
    writeStruct(struct: Struct): void;
    toConsole(): void;
}

const createWriter = (): Writer => {
    let text = "";
    const write = (s: string): void => { text += s; }
    const writeStruct = (struct: Struct): void => {
        const members = struct.members;
        const keys = Object.keys(members);
        const structMembers = keys.map(k => ({
            golangName: pascalCase(k),
            typeName: members[k].type,
            jsonName: k,
            required: members[k].required,
        }));
        const keyLength = structMembers.reduce((agg, m) => Math.max(agg, m.golangName.length), 0);
        const typeLength = structMembers.reduce((agg, m) => Math.max(agg, m.typeName.length), 0);
        write(`type ${struct.name} struct {\n`);
        structMembers.forEach(m => {
            write(`    ${m.golangName.padEnd(keyLength)} ${m.typeName.padEnd(typeLength)} \`json:"${m.jsonName}${m.required ? "" : ",omitempty"}"\`\n`)
        });
        write("}\n\n");
    }
    const toConsole = () => { console.log(text) }
    return { write, writeStruct, toConsole };
}

const pascalCase = (val: string): string =>
    val.split("_").map(s => s[0].toUpperCase() + s.slice(1)).join("")

export { createWriter, pascalCase }
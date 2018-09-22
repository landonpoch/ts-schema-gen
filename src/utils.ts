export interface Writer {
    write(text: string): void;
    toConsole(): void;
}

const createWriter = (): Writer => {
    let text = "";
    const write = (s: string): void => { text += s; }
    const toConsole = () => { console.log(text) }
    return { write, toConsole };
}

const pascalCase = (val: string): string =>
    val.split("_").map(s => s[0].toUpperCase() + s.slice(1)).join("")

export { createWriter, pascalCase }
/// <reference path="globals.d.ts" />

import { Ribbon } from "./test2";

type Alias = Ribbon;

const go_package = "api_test";

type AliasInt = int;
type AliasBoolLiteral = false;
type AliasNumLiteral = 5;
type AliasStrLiteral = "Hello";
type AliasReference = Scalars;
type AliasUnionIntIn8 = int | int8;
type AliasUnionIntInt = int | int;
type AliasUnionInt16Number = int16 | number;
type AliasUnionStringByte = string | byte;
type AliasUnionStringString = string | string;
type AliasUnionStringStringNumber = string | string | number;
type AliasUnionStrLiteralNumLiteral = "Hello" | 42;
type AliasUnionStrLiteralStrLiteral = "Hello" | "World";
type AliasUnionReferenceString = UnionType1 | string;
type AliasUnionReferenceReference = UnionType1 | UnionType1;
type AliasUnionReferenceDiffReference = UnionType1 | UnionType2;
type AliasUnionArrayTypes = int[] | number[];

interface UnionType1 {
    type: "hello";
    dude: string;
    test: string;
    test2?: string;
    test3: Ptr<string>;
    test4: Scalars;
}

interface UnionType2 {
    type: "world";
    other_dude: string;
    test: number;
    test2: string;
    test3: string;
    test4: string;
}

class Scalars {
    // Defaults
    my_boolean: boolean;
    my_number: number;
    my_string: string;

    // Golang type aliases
    my_bool: bool;
    my_int: int;
    my_int8: int8;
    my_int16: int16;
    my_int32: int32;
    my_int64: int64;
    my_uint: uint;
    my_uint8: uint8;
    my_uint16: uint16;
    my_uint32: uint32;
    my_uint64: uint64;
    my_float32: float32;
    my_float64: float64;
    my_byte: byte;
    my_rune: rune;
    
    // Literals
    my_true_literal: true;
    my_false_literal: false;
    my_string_literal: "LITERAL";
    my_numeric_literal: 1000;
}

class Complex {
    my_complex: Scalars;
}

class Arrays {
    // Defaults
    my_boolean: boolean[];
    my_number: number[];
    my_string: string[];

    // Golang type aliases
    my_bool: bool[];
    my_int: int[];
    my_int8: int8[];
    my_int16: int16[];
    my_int32: int32[];
    my_int64: int64[];
    my_uint: uint[];
    my_uint8: uint8[];
    my_uint16: uint16[];
    my_uint32: uint32[];
    my_uint64: uint64[];
    my_float32: float32[];
    my_float64: float64[];
    my_byte: byte[];
    my_rune: rune[];
    
    // Literals
    my_true_literal: true[];
    my_false_literal: false[];
    my_string_literal: "LITERAL"[];
    my_numeric_literal: 1000[];

    // Complex
    my_complex: Scalars[];
}

class Unions {
    union_inline: boolean | boolean; // TODO: Maybe support inline primitives?
    union_alias: AliasUnionReferenceDiffReference;
}

// TODO: Following imports into child files
// TODO: Other potentially scalar interpreted values like time.Time or time.Duration (probably just numerics)
// TODO: property signatures of embedded Map, Generic<T> and Object Literals
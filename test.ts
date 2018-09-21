// TODO: Move golang type aliases to separate file and import them?
// golang type aliases
type bool = boolean;
type int = number;
type int8 = number;
type int16 = number;
type int32 = number;
type int64 = number;
type uint = number;
type uint8 = number;
type uint16 = number;
type uint32 = number;
type uint64 = number;
type float32 = number;
type float64 = number;
type byte = uint8;
type rune = int32;

const go_package = "api_test";

interface Scalars {
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

interface Complex {
    my_complex: Scalars;
}

interface Arrays {
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

interface Unions {
    my_bool_bool_union: boolean | boolean;
    my_num_num_union: number | number;
    my_string_string_union: string | string;
    my_string_string_string_union: string | string | string;
    my_string_number_union: string | number;
    my_string_string_number_union: string | string | number;
    my_false_true_union: false | true;
    my_int_rune_union: int | rune;
}

// interface Ribbon {
//     title: string;
//     tiles: Tile[];
//     total_tiles: int;
// }

// interface Tile {
//     format: "STANDARD";
//     image: Image;
//     title: string;
//     attributes?: Attribute[];
// }

// interface Image {
//     w: int;
//     h: int;
//     url: string;
// }

// interface Attribute {
//     type: "ATTRIBUTE_TYPE";
//     str_value: string;
// }

// TODO: TNullable? vs. Nullable<T> as it relates to T omitempty vs. *T omitempty?
// TODO: Other potentially scalar interpreted values like time.Time or time.Duration (probably just numerics)
// TODO: property signatures of embedded Array, Map, Generic<T>, Object Literals and Objects
// TODO: Union types
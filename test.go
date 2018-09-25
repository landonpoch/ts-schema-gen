type Test struct {
    Test interface{} `json:"test"`
}

package api_test

type AliasInt = int

type AliasBoolLiteral = bool
type AliasNumLiteral = float64
type AliasStrLiteral = string
type AliasReference = Scalars

type AliasUnionIntIn8 = float64
type AliasUnionIntInt = float64
type AliasUnionInt16Number = float64
type AliasUnionStringByte = interface{}
type AliasUnionStringString = string
type AliasUnionStringStringNumber = interface{}
type AliasUnionStrLiteralNumLiteral = interface{}
type AliasUnionStrLiteralStrLiteral = string
type AliasUnionReferenceString = interface{}
type AliasUnionReferenceReference struct {
    Type  string  `json:"type"`
    Dude  string  `json:"dude"`
    Test  string  `json:"test"`
    Test2 string  `json:"test2,omitempty"`
    Test3 *string `json:"test3"`
    Test4 Scalars `json:"test4"`
}

type AliasUnionReferenceDiffReference struct {
    Type      string      `json:"type"`
    Dude      string      `json:"dude,omitempty"`
    Test      interface{} `json:"test"`
    Test2     string      `json:"test2,omitempty"`
    Test3     interface{} `json:"test3"`
    Test4     interface{} `json:"test4"`
    OtherDude string      `json:"other_dude,omitempty"`
}

type AliasUnionArrayTypes = interface{}
type Scalars struct {
    MyBoolean        bool    `json:"my_boolean"`
    MyNumber         float64 `json:"my_number"`
    MyString         string  `json:"my_string"`
    MyBool           bool    `json:"my_bool"`
    MyInt            int     `json:"my_int"`
    MyInt8           int8    `json:"my_int8"`
    MyInt16          int16   `json:"my_int16"`
    MyInt32          int32   `json:"my_int32"`
    MyInt64          int64   `json:"my_int64"`
    MyUint           uint    `json:"my_uint"`
    MyUint8          uint8   `json:"my_uint8"`
    MyUint16         uint16  `json:"my_uint16"`
    MyUint32         uint32  `json:"my_uint32"`
    MyUint64         uint64  `json:"my_uint64"`
    MyFloat32        float32 `json:"my_float32"`
    MyFloat64        float64 `json:"my_float64"`
    MyByte           byte    `json:"my_byte"`
    MyRune           rune    `json:"my_rune"`
    MyTrueLiteral    bool    `json:"my_true_literal"`
    MyFalseLiteral   bool    `json:"my_false_literal"`
    MyStringLiteral  string  `json:"my_string_literal"`
    MyNumericLiteral float64 `json:"my_numeric_literal"`
}

type Complex struct {
    MyComplex Scalars `json:"my_complex"`
}

type Arrays struct {
    MyBoolean        []bool    `json:"my_boolean"`
    MyNumber         []float64 `json:"my_number"`
    MyString         []string  `json:"my_string"`
    MyBool           []bool    `json:"my_bool"`
    MyInt            []int     `json:"my_int"`
    MyInt8           []int8    `json:"my_int8"`
    MyInt16          []int16   `json:"my_int16"`
    MyInt32          []int32   `json:"my_int32"`
    MyInt64          []int64   `json:"my_int64"`
    MyUint           []uint    `json:"my_uint"`
    MyUint8          []uint8   `json:"my_uint8"`
    MyUint16         []uint16  `json:"my_uint16"`
    MyUint32         []uint32  `json:"my_uint32"`
    MyUint64         []uint64  `json:"my_uint64"`
    MyFloat32        []float32 `json:"my_float32"`
    MyFloat64        []float64 `json:"my_float64"`
    MyByte           []byte    `json:"my_byte"`
    MyRune           []rune    `json:"my_rune"`
    MyTrueLiteral    []bool    `json:"my_true_literal"`
    MyFalseLiteral   []bool    `json:"my_false_literal"`
    MyStringLiteral  []string  `json:"my_string_literal"`
    MyNumericLiteral []float64 `json:"my_numeric_literal"`
    MyComplex        []Scalars `json:"my_complex"`
}

type Unions struct {
    UnionInline interface{}                      `json:"union_inline"`
    UnionAlias  AliasUnionReferenceDiffReference `json:"union_alias"`
}


This repo is a work in progress.  The basic concept is create some TypeScript interfaces to describe an API, generate some documentation, and then pick a target language to generate schemas.  Initial implementation will only support golang but if the emitter needs to be extended then additional languages should be able to be added.

# Instructions
Since this library is targeting golang as it emitted language at the moment, the following instructions apply to the golang language specifically.

## Scalar Types:
Scalar types should use the golang primitive values.  Aliases already exist for these:
 - int
 - int8
 - int16
 - rune
 - etc...

## Reference Types:
You should use the class keyword to define a non-scalar schema. By design, interfaces aren't output ot golang code.  See next section on union types.

## Union Types:
You should declare union types like this:
 - type UnionTypeName = Interface1 | Interface2 | Interface3 | etc...

Since interfaces are ignored, you can avoid having unnecessary structs created for the unioned types and simply create one struct for the alias name of the union.  Unions are flattened by default.

Currently unions of array types are not supported and will be generated as interface{} types.

### Example:

```typescript
class Interface1 {
    type: "interface1";
    common_prop1: number;
    common_prop2?: number;
    common_prop3: string;
    unique_prop1: uint16;
}

class Interface2 {
    type: "interface2";
    common_prop1: number;
    common_prop2: number;
    common_prop3: num;
    unique_prop2: string;
}

type MyUnion = Interface1 | Interface2;
```

Outputs the following golang code:

```golang
type MyUnion struct {
    Type        string      `json:"type"`
    CommonProp1 float64     `json:"common_prop1"`
    CommonProp2 float64     `json:"common_prop2,omitempty"` // nullable because it isn't required on all unioned types
    CommonProp3 interface{} `json:"common_prop3"`
    UniqueProp1 uint16      `json:"unique_prop1,omitempty"` // nullable because it doesn't exist on all unioned types
    UniqueProp2 string      `json:"unique_prop2,omitempty"` // nullable because it doesn't exist on all unioned types
}
```

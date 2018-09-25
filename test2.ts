export class Ribbon {
    title: string;
    tiles: Tile[];
    total_tiles: int;
    href: string;
    next?: string;
}

type Tile = StandardTile | ButtonTile;

interface StandardTile {
    format: "STANDARD";
    image: Thumbnail;
    title: string;
    attributes?: Attribute[];
}

interface ButtonTile {
    format: "BUTTON";
}

class Thumbnail {
    w: int;
    h: int;
    url: string;
}

type Attribute = StringAttribute | DurationAttribute | DateAttribute;

interface StringAttribute {
    type: "STRING";
    str_value: string;
}

interface DurationAttribute {
    type: "DURATION";
    str_value: string;
    dur_value: int;
}

interface DateAttribute {
    type: "DATE",
    str_value: string;
    date_value: int;
}
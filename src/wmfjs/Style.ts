/*

The MIT License (MIT)

Copyright (c) 2015 Thomas Bluemel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import { Helper } from './Helper';
import { Obj, PointS } from './Primitives';
import { Bitmap16, DIBitmap, PatternBitmap16 } from './Bitmap';

export class ColorRef {
    r;
    g;
    b;

    constructor(reader, r?, g?, b?) {
        if (reader != null) {
            this.r = reader.readUint8();
            this.g = reader.readUint8();
            this.b = reader.readUint8();
            reader.skip(1);
        } else {
            this.r = r;
            this.g = g;
            this.b = b;
        }
    }

    clone() {
        return new ColorRef(null, this.r, this.g, this.b);
    };

    toHex() {
        var rgb = (this.r << 16) | (this.g << 8) | this.b;
        return (0x1000000 + rgb).toString(16).slice(1);
    };

    toString() {
        return "{r: " + this.r + ", g: " + this.g + ", b: " + this.b + "}";
    };
};

export class Font extends Obj{
    height;
    width;
    escapement;
    orientation;
    weight;
    italic;
    underline;
    strikeout;
    charset;
    outprecision;
    clipprecision;
    quality;
    pitch;
    family;
    facename;

    constructor(reader, copy) {
        super("font");
        if (reader != null) {
            this.height = reader.readInt16();
            this.width = reader.readInt16();
            this.escapement = reader.readInt16();
            this.orientation = reader.readInt16();
            this.weight = reader.readInt16();
            this.italic = reader.readUint8();
            this.underline = reader.readUint8();
            this.strikeout = reader.readUint8();
            this.charset = reader.readUint8();
            this.outprecision = reader.readUint8();
            this.clipprecision = reader.readUint8();
            this.quality = reader.readUint8();
            var pitchAndFamily = reader.readUint8();
            this.pitch = pitchAndFamily & 0xf; // TODO: double check
            this.family = (pitchAndFamily >> 6) & 0x3; // TODO: double check

            var dataLength = copy;
            var start = reader.pos;
            this.facename = reader.readNullTermString(Math.min(dataLength - (reader.pos - start), 32));
        } else if (copy != null) {
            this.height = copy.height;
            this.width = copy.width;
            this.escapement = copy.escapement;
            this.orientation = copy.orientation;
            this.weight = copy.weight;
            this.italic = copy.italic;
            this.underline = copy.underline;
            this.strikeout = copy.strikeout;
            this.charset = copy.charset;
            this.outprecision = copy.outprecision;
            this.clipprecision = copy.clipprecision;
            this.quality = copy.quality;
            this.pitch = copy.pitch;
            this.family = copy.family;
            this.facename = copy.facename;
        } else {
            // TODO: Values for a default font?
            this.height = -80;
            this.width = 0;
            this.escapement = 0;
            this.orientation = 0;
            this.weight = 400;
            this.italic = 0;
            this.underline = 0;
            this.strikeout = 0;
            this.charset = 0;
            this.outprecision = 0;
            this.clipprecision = 0;
            this.quality = 0;
            this.pitch = 0;
            this.family = 0;
            this.facename = "Helvetica";
        }
    }

    clone() {
        return new Font(null, this);
    };

    toString() {
        //return "{facename: " + this.facename + ", height: " + this.height + ", width: " + this.width + "}";
        return JSON.stringify(this);
    };
};



export class Brush extends Obj {
    style;
    color;
    pattern;
    colorusage;
    dibpatternpt;
    hatchstyle;

    constructor(reader, copy, forceDibPattern?) {
        super("brush");
        if (reader != null) {
            var dataLength = copy;
            var start = reader.pos;

            if (forceDibPattern === true || forceDibPattern === false) {
                this.style = reader.readUint16();
                if (forceDibPattern && this.style != Helper.GDI.BrushStyle.BS_PATTERN)
                    this.style = Helper.GDI.BrushStyle.BS_DIBPATTERNPT;
                switch (this.style) {
                    case Helper.GDI.BrushStyle.BS_SOLID:
                        this.color = new ColorRef(reader);
                        break;
                    case Helper.GDI.BrushStyle.BS_PATTERN:
                        reader.skip(forceDibPattern ? 2 : 6);
                        this.pattern = new Bitmap16(reader, dataLength - (reader.pos - start));
                        break;
                    case Helper.GDI.BrushStyle.BS_DIBPATTERNPT:
                        this.colorusage = forceDibPattern ? reader.readUint16() : reader.readUint32();
                        if (!forceDibPattern)
                            reader.skip(2);
                        this.dibpatternpt = new DIBitmap(reader, dataLength - (reader.pos - start));
                        break;
                    case Helper.GDI.BrushStyle.BS_HATCHED:
                        this.color = new ColorRef(reader);
                        this.hatchstyle = reader.readUint16();
                        break;
                }
            } else if (forceDibPattern instanceof PatternBitmap16) {
                this.style = Helper.GDI.BrushStyle.BS_PATTERN;
                this.pattern = forceDibPattern;
            }
        } else {
            this.style = copy.style;
            switch (this.style) {
                case Helper.GDI.BrushStyle.BS_SOLID:
                    this.color = copy.color.clone();
                    break;
                case Helper.GDI.BrushStyle.BS_PATTERN:
                    this.pattern = copy.pattern.clone();
                    break;
                case Helper.GDI.BrushStyle.BS_DIBPATTERNPT:
                    this.colorusage = copy.colorusage;
                    this.dibpatternpt = copy.dibpatternpt;
                    break;
                case Helper.GDI.BrushStyle.BS_HATCHED:
                    this.color = copy.color.clone();
                    this.hatchstyle = copy.hatchstyle;
                    break;
            }
        }
    }

    clone() {
        return new Brush(null, this);
    };

    toString() {
        var ret = "{style: " + this.style;
        switch (this.style) {
            case Helper.GDI.BrushStyle.BS_SOLID:
                ret += ", color: " + this.color.toString();
                break
            case Helper.GDI.BrushStyle.BS_DIBPATTERNPT:
                ret += ", colorusage: " + this.colorusage;
                break;
            case Helper.GDI.BrushStyle.BS_HATCHED:
                ret += ", color: " + this.color.toString() + ", hatchstyle: " + this.hatchstyle;
                break;
        }
        return ret + "}";
    };
};


export class Pen extends Obj{
    style;
    width;
    color;
    linecap;
    join;

    constructor(reader, style?, width?, color?, linecap?, join?) {
        super("pen")
        if (reader != null) {
            var style = reader.readUint16();
            this.style = style & 0xFF;
            this.width = new PointS(reader);
            this.color = new ColorRef(reader);
            this.linecap = (style & (Helper.GDI.PenStyle.PS_ENDCAP_SQUARE | Helper.GDI.PenStyle.PS_ENDCAP_FLAT));
            this.join = (style & (Helper.GDI.PenStyle.PS_JOIN_BEVEL | Helper.GDI.PenStyle.PS_JOIN_MITER));
        } else {
            this.style = style;
            this.width = width;
            this.color = color;
            this.linecap = linecap;
            this.join = join;
        }
    }

    clone() {
        return new Pen(null, this.style, this.width.clone(), this.color.clone(), this.linecap, this.join);
    };

    toString() {
        return "{style: " + this.style + ", width: " + this.width.toString() + ", color: " + this.color.toString() + ", linecap: " + this.linecap + ", join: " + this.join + "}";
    };
};

export class PaletteEntry {
    flag;
    b;
    g;
    r;

    constructor(reader, copy?) {
        if (reader != null) {
            this.flag = reader.readUint8();
            this.b = reader.readUint8();
            this.g = reader.readUint8();
            this.r = reader.readUint8();
        } else {
            this.flag = copy.flag;
            this.b = copy.b;
            this.g = copy.g;
            this.r = copy.r;
        }
    }

    clone() {
        return new PaletteEntry(null, this);
    };
};

export class Palette extends Obj{
    start;
    entries;

    constructor(reader, copy?) {
        super("palette");
        if (reader != null) {
            this.start = reader.readUint16();
            var cnt = reader.readUint16();
            this.entries = [];
            while (cnt > 0)
                this.entries.push(new PaletteEntry(reader));
        } else {
            this.start = copy.start;
            this.entries = [];
            var len = copy.entries.length;
            for (var i = 0; i < len; i++)
                this.entries.push(copy.entries[i]);
        }
    }

    clone() {
        return new Palette(null, this);
    };

    toString() {
        return "{ #entries: " + this.entries.length + "}"; // TODO
    };
};
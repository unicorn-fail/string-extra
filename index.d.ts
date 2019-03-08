import { Chalk } from "chalk";
import { StringJs, StringJsConstructor } from "string";

export type ChalkLike = string|Chalk|Function;
export type StringLike = string|String|StringExtra|StringJs;

export interface StringExtraConfig {
    argStyle: ChalkLike,
    chalk: Chalk,
    color: boolean,
    inline: boolean,
    prefix: StringExtra|null,
    style: ChalkLike,
    suffix: StringExtra|null,
}

export interface StringExtraChalk {
    // Modifiers.
    readonly reset: this;
    readonly bold: this;
    readonly dim: this;
    readonly italic: this;
    readonly underline: this;
    readonly inverse: this;
    readonly hidden: this;
    readonly strikethrough: this;

    // Foreground.
    readonly black: this;
    readonly red: this;
    readonly green: this;
    readonly yellow: this;
    readonly blue: this;
    readonly magenta: this;
    readonly cyan: this;
    readonly white: this;
    readonly gray: this;
    readonly grey: this;
    // The "blackBright" style doesn't actually exist currently.
    // @see https://github.com/chalk/ansi-styles/issues/48
    // @see https://github.com/chalk/chalk/issues/257
    // readonly blackBright: this;
    readonly redBright: this;
    readonly greenBright: this;
    readonly yellowBright: this;
    readonly blueBright: this;
    readonly magentaBright: this;
    readonly cyanBright: this;
    readonly whiteBright: this;

    // Background.
    readonly bgBlack: this;
    readonly bgRed: this;
    readonly bgGreen: this;
    readonly bgYellow: this;
    readonly bgBlue: this;
    readonly bgMagenta: this;
    readonly bgCyan: this;
    readonly bgWhite: this;
    readonly bgBlackBright: this;
    readonly bgRedBright: this;
    readonly bgGreenBright: this;
    readonly bgYellowBright: this;
    readonly bgBlueBright: this;
    readonly bgMagentaBright: this;
    readonly bgCyanBright: this;
    readonly bgWhiteBright: this;
}

export interface StringExtraConstructor extends StringJsConstructor {
    new (value:any, ...args:any[]): StringExtra;

    determinePlaceholders(value:any): string[];

    determineStyle(style:ChalkLike, chalk:Chalk): Function|null;

    escapeRegExp(string:string): string

    format(value:any, args:any[], config:{}): string

    defaultConfig: StringExtraConfig

    sprintfPlaceholders: RegExp
}

export interface StringExtra extends StringExtraChalk, StringJs {

    args: this

    resetStyle: this

    (value?:any, ...args:any[]): StringExtra;

    constructor: StringExtraConstructor;

    config(name?:string, value?:any): this|any

    inline(inline?:boolean): this

    prefix(value:StringLike, delimiter?: StringLike): this

    style(style:ChalkLike, reset?:boolean): this

    suffix(value:StringLike, delimiter?: StringLike): this

    resetFormatted(): this

}

declare function StringExtraFactory(value:any, ...args:any[]): StringExtra;

export default StringExtraFactory;

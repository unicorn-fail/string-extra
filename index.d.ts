// @ts-ignore
import { Buffer } from 'buffer'

// @ts-ignore
import { WritableStream } from 'stream'

// @ts-ignore
import NodeJS from 'NodeJS'

import { Chalk } from "chalk"
import { StringJs, StringJsConstructor } from "./string"

export type ChalkLike = string|Chalk|Function
export type StringLike = ''|string|String|StringExtra|StringJs

export interface StringExtraInspector {
    (value:any, options?:StringExtraOptions): StringLike
}

export interface StringExtraChalk {
    // Modifiers.
    readonly reset: StringExtra
    readonly bold: StringExtra
    readonly dim: StringExtra
    readonly italic: StringExtra
    readonly underline: StringExtra
    readonly inverse: StringExtra
    readonly hidden: StringExtra
    readonly strikethrough: StringExtra

    // Foreground.
    readonly black: StringExtra
    readonly red: StringExtra
    readonly green: StringExtra
    readonly yellow: StringExtra
    readonly blue: StringExtra
    readonly magenta: StringExtra
    readonly cyan: StringExtra
    readonly white: StringExtra
    readonly gray: StringExtra
    readonly grey: StringExtra
    // The "blackBright" style doesn't actually exist currently.
    // @see https://github.com/chalk/ansi-styles/issues/48
    // @see https://github.com/chalk/chalk/issues/257
    // readonly blackBright: StringExtra
    readonly redBright: StringExtra
    readonly greenBright: StringExtra
    readonly yellowBright: StringExtra
    readonly blueBright: StringExtra
    readonly magentaBright: StringExtra
    readonly cyanBright: StringExtra
    readonly whiteBright: StringExtra

    // Background.
    readonly bgBlack: StringExtra
    readonly bgRed: StringExtra
    readonly bgGreen: StringExtra
    readonly bgYellow: StringExtra
    readonly bgBlue: StringExtra
    readonly bgMagenta: StringExtra
    readonly bgCyan: StringExtra
    readonly bgWhite: StringExtra
    readonly bgBlackBright: StringExtra
    readonly bgRedBright: StringExtra
    readonly bgGreenBright: StringExtra
    readonly bgYellowBright: StringExtra
    readonly bgBlueBright: StringExtra
    readonly bgMagentaBright: StringExtra
    readonly bgCyanBright: StringExtra
    readonly bgWhiteBright: StringExtra

    // Custom styles.
    readonly america: StringExtra
    readonly christmas: StringExtra
    readonly header: StringExtra
    readonly rainbow: StringExtra
    readonly zebra: StringExtra
}

export interface StringExtraOptions {
    activeStyle: string
    args: any[]
    argStyle: ChalkLike
    color: boolean
    encoding: string
    inspector: StringExtraInspector
    inspectorOptions: Object
    nullAsEmptyString: boolean
    prefix: StringLike
    prefixDelimiter: StringLike
    style: ChalkLike
    styleSpaces: boolean
    suffix: StringLike
    suffixDelimiter: StringLike
}

export interface StringExtraStaticDeprecated {
    /**
     * @deprecated since 1.0.2. Use StringExtra.create instead.
     */
    S(value:any, ...args:any[]): StringExtra
}

export interface StringExtraConstructor extends StringExtraStaticDeprecated, StringJsConstructor {
    new (value:any, options?:StringExtraOptions): StringExtra

    create(value:any, options?:StringExtraOptions): StringExtra

    createRoot(value:any, options?:StringExtraOptions): StringExtra

    cloneInstance(instance:StringLike|any): StringExtra

    cloneRootInstance(instance:StringLike|any): StringExtra

    deprecated(value:any, options?:StringExtraOptions): StringExtra

    escapeRegExp(string:string): string

    hookStream(...streams:(WritableStream|NodeJS.WriteStream)[]): void

    unhookStream(...streams:(WritableStream|NodeJS.WriteStream)[]): void

    defaultOptions: StringExtraOptions

    defaultStyles: {[key: string]: string[]}

    inspectProperties: Symbol

    sprintfPlaceholders: RegExp

    StringExtra: StringExtra

    StringJs: StringJs
}

export interface StringExtraDeprecated {
    /**
     * @deprecated Use appropriate setter/getter option methods instead.
     */
    config(name?:string, value?:any): StringExtra|any

    /**
     * @deprecated Use appropriate setter/getter option methods instead.
     */
    config(option?:StringExtraOptions): StringExtra|any

    /**
     * @deprecated Use appropriate setter/getter option methods instead.
     */
    option(name?:string, value?:any): StringExtra|any

    /**
     * @deprecated Use appropriate setter/getter option methods instead.
     */
    option(option?:StringExtraOptions): StringExtra|any

}

export interface StringExtra extends StringExtraDeprecated, StringExtraChalk, StringJs {

    (value?:any, ...args:any[]): StringExtra

    constructor: StringExtraConstructor

    argStyle: StringExtra

    b: Buffer

    rawLength: number

    resetStyle: StringExtra

    args(...args:any): StringExtra

    attachCustomInspector(): void

    clone(): StringExtra

    cloneRoot(): StringExtra

    customInspector(): string

    extractPlaceholders(value:any): string[]

    format(value:any, args:any[], options:{}): string

    formatTheme(value:string, theme:ChalkLike[]): string

    getOption(name:string):any

    getOptions(): StringExtraOptions

    inspect(): StringExtra

    prefix(value:StringLike, delimiter?: StringLike): StringExtra

    setOption(name:string, value:any): StringExtra

    setOptions(options:StringExtraOptions): StringExtra

    style(style:ChalkLike, reset?:boolean): StringExtra

    suffix(value:StringLike, delimiter?: StringLike): StringExtra

    resetFormatted(): StringExtra

}

declare function StringExtraFactory(value:any, ...args:any[]): StringExtra

export default StringExtraFactory

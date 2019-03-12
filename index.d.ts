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
    (value:any, config:StringExtraConfig): StringLike
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

export interface StringExtraConfig {
    activeStyle: string
    argStyle: ChalkLike
    color: boolean
    encoding: string
    inspector: StringExtraInspector
    inspectorConfig: Object
    nullAsEmptyString: boolean
    prefix: StringLike
    style: ChalkLike
    styleSpaces: boolean
    suffix: StringLike
}

export interface StringExtraConstructor extends StringJsConstructor {
    new (value:any, ...args:any[]): StringExtra

    create(value:any, ...args:any[]): StringExtra

    extractPlaceholders(value:any): string[]

    escapeRegExp(string:string): string

    format(value:any, args:any[], config:{}): string

    hookStream(...streams:(WritableStream|NodeJS.WriteStream)[]): void

    unhookStream(...streams:(WritableStream|NodeJS.WriteStream)[]): void

    defaultConfig: StringExtraConfig

    sprintfPlaceholders: RegExp
}

export interface StringExtra extends StringExtraChalk, StringJs {

    argStyle: StringExtra

    b: Buffer

    resetStyle: StringExtra

    (value?:any, ...args:any[]): StringExtra

    constructor: StringExtraConstructor

    args(...args:any): StringExtra

    config(name?:string, value?:any): StringExtra|any

    config(config?:StringExtraConfig): StringExtra|any

    prefix(value:StringLike, delimiter?: StringLike): StringExtra

    style(style:ChalkLike, reset?:boolean): StringExtra

    suffix(value:StringLike, delimiter?: StringLike): StringExtra

    resetFormatted(): StringExtra

}

declare function StringExtraFactory(value:any, ...args:any[]): StringExtra

export default StringExtraFactory

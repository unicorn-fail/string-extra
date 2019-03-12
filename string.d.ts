export interface StringJsConstructor {
    new (value:any): StringJs

    ENTITIES: Object

    TMPL_CLOSE: string
    TMPL_OPEN: string

    VERSION:string

    extendPrototype()
    restorePrototype()
}

export interface StringJs extends String {

    (value: any): this

    constructor: StringJsConstructor

    s: string

    between(left: string, right: string): this

    camelize(): this

    capitalize(): this

    chompLeft(prefix: string): this

    chompRight(suffix: string): this

    collapseWhitespace(): this

    contains(string: string): number

    count(substring): number

    dasherize(): this

    equalsIgnoreCase(prefix: string): boolean

    latinise(): this

    decodeHtmlEntities(): this

    escapeHTML(): this

    ensureLeft(prefix: string): this

    ensureRight(suffix: string): this

    humanize(): this

    isAlpha(): boolean

    isAlphaNumeric(): boolean

    isEmpty(): boolean

    isLower(): boolean

    isNumeric(): boolean

    isUpper(): boolean

    left(number: number): this

    lines(): string[],

    pad(length: number, character?: string): this

    padLeft(length: number, character?: string): this

    padRight(length: number, character?: string): this

    parseCSV(delimiter?: string, qualifier?: string, escape?: string, lineDelimiter?: string): string[]

    replaceAll(search: string, replace: string): this

    splitLeft(separator: string, maxSplit?: number, limit?: number): string[]

    splitRight(separator: string, maxSplit?: number, limit?: number): string[]

    strip(...remove: string[]): this

    stripLeft(pattern: string): this

    stripRight(pattern: string): this

    right(number: number): this

    setValue(value: string): this

    slugify(): this

    stripPunctuation(): this

    stripTags(...tags: string[]): this

    template(values: object, opening?: string, closing?: string): this

    times(number: number): this

    titleCase(): this

    toBoolean(): boolean

    toFloat(precision?: number): number

    toInt(): number

    truncate(length, ending?: string): this

    toCSV(delimiter?: string, qualifier?: string): this

    toCSV(options?: object): this

    underscore(): this

    unescapeHTML(): this

    wrapHTML(tag?: string, attributes?: object): this

}

declare function StringJsFactory(value:any): StringJs

export default StringJs

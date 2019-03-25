// @todo Move to an upstream project like @string.js/cli.

// Node.js.
const util = require('util');
const Stream = require('stream');
const eol = require('os').EOL;

// Modules.
const { sprintf } = require('sprintf-js');
const ansiRegex = require('ansi-regex');
// noinspection JSUnresolvedVariable

const string = require('string');
const StringJs = string().constructor;

// Unfortunately, the static methods and properties are exported separately
// and not members of the constructor; merge them in.
Object.keys(string).filter(p => string.hasOwnProperty(p)).forEach(p => StringJs[p] = string[p]);

// Local.
const chalk = require('./chalk.js').default;
const pkg = require('./package.json');

// Until private variables are supported by Node natively, use WeakMaps.
// Shamelessly copied from https://www.npmjs.com/package/prv
const _private = (() => {
  const p = new WeakMap();
  return (o, d = {}) => {
    if (!p.has(o)) {
      p.set(o, d);
    }
    return p.get(o)
  }
})();

const unique = x => [...new Set(x)];

let extendedPrototype = [];

/**
 * @class StringExtra
 */
class StringExtra extends StringJs {

  /**
   * Constructs a new StringExtra object.
   *
   * @param {*} [value = '']
   *   The value to use.
   * @param {Object<StringExtraOptions>} [options]
   *   Initial configuration options.
   */
  constructor(value = '', options = {}) {
    // Initialize with a blank string so it doesn't convert the original value.
    super();
    this._prefix = '';
    this._suffix = '';
    this.orig = value;
    this.setOptions(options);
  }

  /**
   * Custom Node.js inspection, used mainly for console.log().
   *
   * @return {String}
   */
  [util.inspect.custom]() {
    return this.toString();
  }

  /**
   * Factory create method.
   *
   * @param {*} [value = '']
   *   The value to use.
   * @param {...*} [args = []]
   *   The placeholder values.
   *
   * @return {StringExtra}
   *
   * @deprecated since 1.0.2. Use StringExtra.create instead.
   */
  static S(value = '', ...args) {
    const _this = this || StringExtra;
    _this.deprecated('Usage of StringExtra.S() has been deprecated. Use StringExtra.create() instead.', { stackTrace: !args.length });
    if (args.length) {
      _this.deprecated(`Usage of variadic arguments has been deprecated. Use one of the following replacements instead:${eol}- Pass an "args" option, e.g.: StringExtra.create(value, { args }) (recommended)${eol}- Use the sprintf array shorthand syntax, e.g.: StringExtra.create([value, ...args])`);
    }
    return _this.create(value, {args});
  }

  /**
   * Factory create method.
   *
   * @param {*} [value = '']
   *   The value to use.
   * @param {Object<StringExtraOptions>} [options]
   *   Initial configuration options.
   *
   * @return {StringExtra}
   */
  static create(value = '', options = {}) {
    // If value is already an instance, just return it.
    if (value instanceof StringJs) {
      return value;
    }
    const _this = this || StringExtra;
    return new _this(value, options);
  }

  /**
   * Factor create method.
   *
   * Note: this is primarily used internally for creating new instances that
   * won't cause recursion (e.g. prefix, suffix, placeholders, etc.). It does
   * not inherit any extended constructor.
   *
   * @param {*} [value = '']
   *   The value to use.
   * @param {Object<StringExtraOptions>} [options]
   *   Initial configuration options.
   *
   * @return {StringExtra}
   */
  static createRoot(value = '', options = {}) {
    return new StringExtra(value, options);
  }

  /**
   * Creates a deprecation notice.
   *
   * @param {*} [value = '']
   *   The value to use.
   * @param {Object<StringExtraOptions>} [options]
   *   Initial configuration options.
   *
   * @return {StringExtra}
   */
  static deprecated(value, options = {}) {
    const _this = this || StringExtra;
    const deprecated = _this.create(value, {
      stackTrace: true,
      print: true,
      stream: process.stderr,
      style: chalk.native.yellow,
      ...options
    });

    deprecated.prefix(_this.create('warning').yellow.bgBlackBright);

    if (deprecated.getOption('stackTrace')) {
      deprecated.suffix(_this.create(eol + new Error().stack.split(eol).slice(1).join(eol)).dim)
    }

    if (deprecated.getOption('print')) {
      const stream = deprecated.getOption('stream');
      stream.write(`${deprecated}${eol}`);
    }

    return deprecated;
  }

  /**
   * Escapes a string so it can be used in a regular expression.
   *
   * @param {String} string
   *   The string to escape.
   *
   * @return {String}
   *   The escaped string.
   */
  static escapeRegExp(string) {
    // most part from https://github.com/skulpt/skulpt/blob/ecaf75e69c2e539eff124b2ab45df0b01eaf2295/src/str.js#L242
    const ret = [];
    const re = /^[A-Za-z0-9]+$/;
    let s = string == null ? '' : '' + string;
    for (let i = 0; i < s.length; ++i) {
      let c = s.charAt(i);
      if (re.test(c)) {
        ret.push(c);
        continue;
      }
      ret.push(c === '\\000' ? '\\000' : `\\${c}`);
    }
    return ret.join('');
  }

  static extendPrototype() {
    const _this = this || StringExtra;

    // Immediately return if already extended.
    if (extendedPrototype.length) {
      return;
    }

    const proto = _this.prototype;

    const storedStrings = _private(_this);
    const applyMethod = (string, method, args) => {
      const original = string;
      if (!storedStrings[string]) {
        storedStrings[string] = _this.create(string);
      }
      const instance = storedStrings[string];
      string = method.apply(instance, args).toString();
      delete storedStrings[original];
      storedStrings[string] = instance;
      return string;
    };

    // Only fill in the missing properties.
    const StringProto = Object.keys(Object.getOwnPropertyDescriptors(String.prototype));
    const StringJsProto = Object.keys(Object.getOwnPropertyDescriptors(StringJs.prototype));
    const StringExtraProto = Object.keys(Object.getOwnPropertyDescriptors(proto));
    const properties = [...StringExtraProto, ...StringJsProto].filter(p => StringProto.indexOf(p) === -1);
    properties.forEach(p => {
      const descriptor = Object.getOwnPropertyDescriptor(proto, p);
      if (descriptor && typeof descriptor.get === 'function') {
        extendedPrototype.push(p);
        const originalGet = descriptor.get;
        descriptor.configurable = true;
        descriptor.get = function () {
          return applyMethod(this, originalGet, arguments);
        };
        Object.defineProperty(String.prototype, p, descriptor);
      }
      else if (typeof proto[p] === 'function') {
        extendedPrototype.push(p);
        String.prototype[p] = function() {
          return applyMethod(this, proto[p], arguments);
        }
      }
    });
  }

  static restorePrototype() {
    for (let i = 0, l = extendedPrototype.length; i < l; i++) {
      const prop = extendedPrototype[i];
      delete String.prototype[prop];
    }
    extendedPrototype = [];
  }

  /**
   * Extracts the placeholders from a value.
   *
   * @param {String|Array} value
   *   The value to check.
   * @param {Boolean} [strict=true]
   *   Flag indicating whether it should check that there are enough
   *   argument values for placeholders found (if an array).
   *
   * @return {String[]}
   *   An array of placeholders, if any.
   */
  extractPlaceholders(value, strict = true) {
    if (typeof value === 'string') {
      const match = value.match(this.constructor.sprintfPlaceholders);
      if (match) {
        return match;
      }
    }

    // Support the array sprintf syntax, e.g. ['Format %s', 'value'].
    // Note: this requires the first array argument to be a string or an object
    // that converts to a string using toString(). It must also contain greater
    // than or equal subsequent placeholder values in the array to match the
    // corresponding placeholders in the string.
    if (Array.isArray(value) && typeof value[0] === 'string') {
      const args = value.slice(1);
      value = `${value[0]}`;
      const match = value.match(this.constructor.sprintfPlaceholders);

      // Ensure that there are enough placeholder values.
      if (match && (!strict || args.length >= match.length)) {
        return match;
      }
    }

    return [];
  }

  /**
   * Formats a value based on provided arguments and configuration.
   *
   * @return {String}
   *   The formatted string.
   */
  format() {
    const options = this.getOptions();
    const value = this.orig;

    // Immediately return if a null value.
    if (value === null) {
      return options.nullAsEmptyString ? '' : 'null';
    }

    // Support the array sprintf syntax, e.g. ['Format %s', 'value'].
    // Note: this requires the first array argument to be a string or an object
    // that converts to a string using toString(). It must also contain greater
    // than or equal subsequent placeholder values in the array to match the
    // corresponding placeholders in the string.
    let args = [].concat(options.args);
    let string = value;
    let placeholders = this.extractPlaceholders(value);
    if (Array.isArray(value) && placeholders.length) {
      string = value[0];
      args = args.concat(value.slice(1));
    }

    if (typeof string === 'string' && args.length && args.length >= placeholders.length) {
      // If there's a chalk style applied to the whole string, then closing
      // this argument will remove it from the string. The beginning style of
      // the original chalk style needs to be appended.
      if (options.color && options.argStyle) {
        // Replace non-string placeholders with %s.
        const escapedPlaceholders = unique(placeholders.filter(p => p && p !== '%s')).map(this.constructor.escapeRegExp);
        if (escapedPlaceholders.length) {
          string = string.replace(new RegExp(escapedPlaceholders.join('|'), 'g'), '%s');
        }

        // Replace argument values with the styled equivalents.
        placeholders.forEach((placeholder, index) => {
          if (args[index] === undefined) {
            return placeholder;
          }
          // Handle inspection of objects manually as sprintf just uses JSON.
          if (placeholder === '%j') {
            args[index] = this.inspect(args[index], options);
          }
          // Convert the placeholder value. This is needed so that any
          // numerical formatting still happens; which requires the raw value.
          else if (placeholder !== '%s') {
            args[index] = sprintf(placeholder, args[index]);
          }

          // Now, style it accordingly and replace the placeholder with %s.
          const p = this.constructor.createRoot(args[index]).style(options.argStyle);
          args[index] = options.style ? chalk.wrap(p, options.style) : p;
        });
      }
    }
    else {
      switch (typeof value) {
        case 'boolean':
        case 'number':
        case 'string':
          string = `${string}`;
          break;

        default:
          string = value instanceof StringJs ? value : this.inspect(value, options);
      }
    }

    if (options.color && typeof options.style === 'function') {
      string = options.style(string);
    }

    // Replace final placeholders with values (must happen after styling).
    if (args.length) {
      string = sprintf(string, ...args);
    }

    let prefix = this._prefix instanceof StringJs || typeof this._prefix === 'string' ? this._prefix : this.constructor.createRoot(this._prefix);
    let prefixString = `${prefix}`;
    let prefixLength = prefixString.replace(ansiRegex(), '').length;
    let prefixDelimiter = prefixLength ? this.getOption('prefixDelimiter', ' ') : '';
    let suffix = this._suffix instanceof StringJs || typeof this._suffix === 'string' ? this._suffix : this.constructor.createRoot(this._suffix);
    let suffixString = `${suffix}`
    let suffixLength = suffixString.replace(ansiRegex(), '').length;
    let suffixDelimiter = suffixLength ? this.getOption('suffixDelimiter', ' ') : '';

    // Indent new lines to match the prefix length.
    // @todo Maybe add better/official "indent" support.
    if (prefixLength > 1) {
      if (string instanceof StringJs && string.orig.indexOf(eol) !== -1) {
        string.orig = string.orig.split(eol).join(eol + ' '.repeat(prefixLength));
      }
      else if (string.indexOf(eol) !== -1) {
        string = string.split(eol).join(eol + ' '.repeat(prefixLength));
      }
      if (suffix instanceof StringJs && suffix.orig.indexOf(eol) !== -1) {
        suffix.orig = suffix.orig.split(eol).join(eol + ' '.repeat(prefixLength));
      }
      else if (suffixString.indexOf(eol) !== -1) {
        suffixString = suffixString.split(eol).join(eol + ' '.repeat(prefixLength));
      }
    }

    return `${prefix}${prefixDelimiter}${string}${suffixDelimiter}${suffixString}`;
  }

  formatTheme(value, theme = []) {
    const styleSpaces = this.getOption('styleSpaces');
    const placeholders = this.extractPlaceholders(value);
    const chars = String.prototype.split.call(value, '');
    const len = theme.length;
    let index = 0;
    return chars.map((c, i) => {
      // Skip spaces and placeholders.
      if (
        (!styleSpaces && c === ' ') ||
        (c === '%' && chars[i + 1] && placeholders.indexOf(`${c}${chars[i + 1]}`) !== -1) ||
        (chars[i - 1] === '%' && placeholders.indexOf(`${chars[i - 1]}${c}`) !== -1)
      ) {
        return c;
      }
      const style = theme[index++%len];
      const color = chalk.pipe(style);
      return color ? color(c) : c;
    }).join('');
  }

  attachCustomInspector(value) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return;
    }

    const options = this.getOptions();
    if (!Array.isArray(value) && typeof value === 'object' && value && !value[util.inspect.custom]) {
      value[util.inspect.custom] = (depth, options) => {
        return this.customInspector(value, Object.assign({}, options.inspectorOptions, options));
      };
    }

    // Immediately return if there is no depth.
    if (!options.inspectorOptions || (!options.inspectorOptions.depth && options.inspectorOptions.depth !== null && options.inspectorOptions.depth !== Infinity)) {
      return;
    }

    // Recursively attach inspector on sub-properties.
    const properties = Object.keys(value).filter(p => value.hasOwnProperty && value.hasOwnProperty(p) && !Array.isArray(value[p]) && typeof value[p] === 'object');
    const newOptions = Object.assign({}, options, {
      inspectorOptions: Object.assign({}, options.inspectorOptions, {
        depth: options.inspectorOptions.depth === null ? null : options.inspectorOptions.depth - 1
      })
    });
    for (let i = 0, l = properties.length; i < l; i++) {
      this.attachCustomInspector(value[properties[i]], newOptions);
    }
  }

  /**
   * Hooks existing WritableStream objects.
   *
   * The write method on WritableStream objects will be intercepted to convert
   * StringExtra objects into Buffer instances so they can be passed directly
   * to a WritableStream.
   *
   * @param {...(WritableStream|NodeJS.WriteStream)} streams
   *   One or more WritableStream objects.
   */
  static hookStream(...streams) {
    streams.forEach(stream => {
      if (stream instanceof Stream.Writable && !stream.stringExtraOriginalWrite) {
        // noinspection JSUndefinedPropertyAssignment, JSUnresolvedVariable
        stream.stringExtraOriginalWrite = stream.write;
        // noinspection JSUndefinedPropertyAssignment
        stream.write = function(data, ...args) {
          if (data instanceof StringExtra) {
            data = data.b;
          }
          // noinspection JSUnresolvedVariable
          stream.stringExtraOriginalWrite.call(this, data, ...args);
        };
      }
    });
    return this || StringExtra;
  }

  /**
   * Unhooks existing WritableStream objects.
   *
   * The write method on WritableStream objects will be restored to their
   * original functionality.
   *
   * @param {...(WritableStream|NodeJS.WriteStream)} streams
   *   One or more WritableStream objects.
   */
  static unhookStream(...streams) {
    streams.forEach(stream => {
      // noinspection JSUnresolvedVariable
      if (stream instanceof Stream.Writable && stream.stringExtraOriginalWrite) {
        stream.write = stream.stringExtraOriginalWrite;
        delete stream.stringExtraOriginalWrite;
      }
    });
  }

  inspect(value) {
    const options = this.getOptions();
    if (typeof options.inspector !== 'function') {
      throw new TypeError('Provided inspector is not a callable function.');
    }
    if (value instanceof Map) {
      value = {...value};
    }
    else if (value instanceof Set) {
      value = [...value];
    }
    this.attachCustomInspector(value, options);
    return this.constructor.createRoot(options.inspector.call(value, value, options.inspectorOptions, this));
  }

  customInspector(value, options) {
    options = {...this.getOptions(), ...options};
    const name = value.constructor.name !== 'Object' ? options.stylize(value.constructor.name, 'special') : '';

    // Immediately return if there is no depth.
    if (!options.depth && options.depth !== null && options.depth !== Infinity) {
      return name ? `[${name}]` : options.stylize(value.constructor.name, 'special');
    }

    const newline = options.compact ? '' : eol;

    // Determine the properties that should be inspected.
    let properties = null;
    if (value[StringExtra.inspectProperties]) {
      properties = value[StringExtra.inspectProperties]();
    }
    if (!Array.isArray(properties)) {
      properties = Object.keys(value);
    }
    properties = properties.filter(p => value.hasOwnProperty(p) && p !== 'toJSON');

    // Immediately return if there are no properties to inspect.
    if (!properties.length) {
      return `[${name}]`;
    }

    const newOptions = Object.assign({}, options, {
      depth: options.depth === null ? null : options.depth - 1
    });

    // Separator is based on whether it should be compact or not. If it's
    // compact, it's just a space. If it's not compact, then it's a newline
    // and some padding.
    const separator = options.compact ? ' ' : `${newline}  `;
    const inner = properties.map(p => {
      const v = this.customInspector(value[p], newOptions).replace(new RegExp(eol, 'g'), `,${separator}`);
      return `${p}: ${v}`;
    }).join(`,${separator}`);

    return `${newline}${name ? `${name} ` : ''}{${separator}${inner} ${newline}}${newline}`;
  }

  /**
   * Sets the arguments used for placeholders.
   *
   * @param {...*} args
   *   An array of values.
   *
   * @return {StringExtra}
   */
  args(...args) {
    if (args.length) {
      const placeholders = this.extractPlaceholders(this.orig);
      args = placeholders ? [...args].concat(Array.isArray(this.orig) ? this.orig.slice(1) : []).slice(0, placeholders.length) : [];
    }
    return this.setOption('args', args);
  }

  clone() {
    return this.constructor.create(this.orig, this._options).prefix(this._prefix).suffix(this._suffix);
  }

  cloneRoot() {
    return this.constructor.createRoot(this.orig, this._options).prefix(this._prefix).suffix(this._suffix);
  }

  static cloneInstance(instance) {
    if (!(instance instanceof StringJs)) {
      return this.create(instance);
    }
    const clone = this.create(instance.orig, instance.getOptions());
    if (instance instanceof StringExtra) {
      clone.prefix(instance._prefix).suffix(instance._suffix);
    }
    return clone;
  }

  static cloneRootInstance(instance) {
    if (!(instance instanceof StringJs)) {
      return this.createRoot(instance);
    }
    const clone = this.createRoot(instance.orig, instance.getOptions());
    if (instance instanceof StringExtra) {
      clone.prefix(instance._prefix).suffix(instance._suffix);
    }
    return clone;
  }

  /**
   * Retrieves or sets configuration options.
   *
   * @param {String|StringExtraOptions} [name]
   *   The name of the option to retrieve/set. If not set, the entire
   *   option will be returned. If passed as an object, it will merge any
   *   key/value pair options passed.
   * @param {*} [value]
   *   The value of the option to set. If not provided, the current set
   *   value will be returned.
   *
   * @return {StringExtra|StringExtraOptions|*}
   *   If both name and value are provided, this is in "set" mode and the
   *   StringExtra instance will be returned as a result. If name was provided,
   *   but not value, this will return whatever value is currently set for name.
   *   If neither name nor value is provided, the entire options object is
   *   returned.
   *
   * @deprecated Use appropriate setter/getter option methods instead.
   */
  option(name, value) {
    if (typeof name === 'object') {
      this.constructor.deprecated('Usage of StringExtra.option({}) to set multiple options is deprecated. Use StringExtra.setOptions() instead.');
      return this.setOptions(name);
    }
    if (name === undefined) {
      this.constructor.deprecated('Usage of StringExtra.option() to retrieve all options is deprecated. Use StringExtra.getOptions() instead.');
      return this.getOptions();
    }
    if (value === undefined) {
      this.constructor.deprecated('Usage of StringExtra.option(name) to retrieve a single option is deprecated. Use StringExtra.getOption(name) instead.');
      return this.getOption(name);
    }
    this.constructor.deprecated('Usage of StringExtra.option(name, value) to set a single option is deprecated. Use StringExtra.setOption(name, value) instead.');
    return this.setOption(name, value);
  }

  /**
   * Provide an alias for BC reasons.
   *
   * @deprecated Use appropriate setter/getter option methods instead.
   */
  config(...args) {
    return this.option(...args);
  }

  /**
   * @return {*}
   */
  getOption(name, defaultValue = undefined) {
    const options = this.getOptions();
    const value = name.split('.').reduce((o,i)=>o[i], options);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * @return {StringExtraOptions}
   */
  getOptions() {
    if (!this._options) {
      this._options = {...this.constructor.defaultOptions};
    }
    return {...this._options};
  }

  /**
   * @return {StringExtra}
   */
  setOption(name, value) {
    const options = this.getOptions();
    const parts = name.split('.');
    name = parts.pop();
    const obj = parts.slice(0, parts.length - 1).reduce((o,i)=>o[i], options);
    obj[name] = value;
    return this.setOptions(options);
  }

  /**
   * @return {StringExtra}
   */
  setOptions(options = {}) {
    this._options = {...this.getOptions(), ...options};
    return this.resetFormatted();
  }

  /**
   * @return {StringExtra}
   */
  prefix(value, delimiter) {
    if (!value) {
      this._prefix = '';
      return this;
    }
    if (!(value instanceof StringJs)) {
      value = this.constructor.createRoot(value);
    }
    if (delimiter) {
      this.setOption('prefixDelimiter', this.constructor.createRoot(delimiter));
    }
    // Prepend prefix if one already exists.
    if (this._prefix) {
      this._prefix.prefix(value);
    }
    else {
      this._prefix = value;
      return this.resetFormatted();
    }
    return this;
  }

  /**
   * @return {StringExtra}
   */
  resetFormatted() {
    delete this._formatted;
    return this;
  }

  /**
   * @return {StringExtra}
   */
  style(style, reset = false) {
    const activeStyle = this.getOption('activeStyle');
    let existing = reset ? chalk.native : this.getOption(activeStyle, chalk.native);

    let argStyle;
    if (style) {
      if (typeof style === 'string') {
        const styles = style.split('.argStyle.');
        style = chalk.pipe(styles[0], existing);
        if (styles[1]) {
          argStyle = styles[1];
        }
      }
      if (Array.isArray(style)) {
        const theme = style;
        style = (string) => existing(string === chalk.styleDelimiter ? string : this.formatTheme(string, theme));
      }
      if (typeof style !== 'function') {
        throw new TypeError('Provided style must either be a string of chalk styles, piped using dot notation or a function that will be passed a single string value.');
      }
    }

    // Set the current active style.
    this.setOption(activeStyle, style || existing || chalk.native);

    // Set the argument style, if any (deferred pipe string).
    if (activeStyle === 'style' && argStyle) {
      return this.argStyle.style(argStyle);
    }

    return this;
  }

  /**
   * @return {StringExtra}
   */
  suffix(value, delimiter) {
    if (!value) {
      this._suffix = '';
      return this;
    }
    if (!(value instanceof StringJs)) {
      value = this.constructor.createRoot(value);
    }
    if (delimiter) {
      this.setOption('suffixDelimiter', this.constructor.createRoot(delimiter));
    }
    // Append suffix if one already exists.
    if (this._suffix) {
      this._suffix.suffix(value);
    }
    else {
      this._suffix = value;
      return this.resetFormatted();
    }
    return this;
  }

  toString() {
    // Immediately return any formatted result currently set.
    if (typeof this._formatted === 'string') {
      return this._formatted;
    }

    this._formatted = this.format();

    return this._formatted;
  }

  get argStyle() {
    return this.setOption('activeStyle', 'argStyle').resetStyle;
  }

  get b() {
    return Buffer.from(this.toString(), this.getOption('encoding'));
  }

  get header() {
    return this.whiteBright.bold.underline.argStyle.whiteBright.bold.underline;
  }

  get json() {
    return this.setOption('inspector', value => JSON.stringify(value));
  }

  get length() {
    return this.toString().replace(ansiRegex(), '').length;
  }

  // string.js sets the length on the object during initialization; ignore it.
  // @todo Remove this when string.js is upgraded.
  set length(value) {
  }

  get rawLength() {
    return this.toString().length;
  }

  get resetStyle() {
    return this.style(undefined, true);
  }

  get s() {
    return this.toString();
  }

  set s(value) {
    this.orig = value;
    this.resetFormatted();
  }

}

// Support chainable chalk properties by proxying the style method.
const chalkProperties = [].concat(chalk.modifiers, chalk.fg, chalk.bg);
for (let i = 0, l = chalkProperties.length; i < l; i++) {
  let prop = chalkProperties[i];
  // Skip properties already set or non-existent on Chalk.
  if (StringExtra.prototype.hasOwnProperty(prop) || typeof chalk.native[prop] !== 'function') {
    continue;
  }

  Object.defineProperty(StringExtra.prototype, prop, {
    get() {
      let style = this.getOption(this.getOption('activeStyle'), chalk.native);
      return this.style(style[prop]);
    },
    enumerable : true,
    configurable : true
  });
}

/**
 * @type {Object<StringExtraOptions>}
 */
StringExtra.defaultOptions = {
  activeStyle: 'style',
  args: [],
  argStyle: chalk.native.bold.whiteBright,
  color: !!(chalk.native.enabled && chalk.native.supportsColor && chalk.native.level),
  encoding: 'utf-8',
  inspector: util.inspect,
  inspectorOptions: {
    depth: 1,
    colors: !!(chalk.native.enabled && chalk.native.supportsColor && chalk.native.level),
    compact: true,
  },
  nullAsEmptyString: true,
  prefixDelimiter: ' ',
  style: undefined,
  styleSpaces: false,
  suffixDelimiter: ' ',
};

StringExtra.defaultStyles = {
  america: ['red', 'whiteBright', 'blue'],
  christmas: ['red', 'green'],
  rainbow: ['red', 'orange', 'yellow', 'green', 'blue', 'magenta'],
  zebra: ['inverse', 'default'],
};
for (let [prop, style] of Object.entries(StringExtra.defaultStyles)) {
  Object.defineProperty(StringExtra.prototype, prop, {
    get : function() {
      return this.style(style);
    },
    enumerable : true,
    configurable : false
  });
}

StringExtra.sprintfPlaceholders = /(%[-.\d]*[A-Za-z])/g;

StringExtra.inspectProperties = Symbol('string-extra.inspect.properties');

StringExtra.VERSION = pkg.version;

module.exports = StringExtra;

module.exports.StringJs = StringJs;
module.exports.StringExtra = StringExtra;

// Support ES6 import/typescript.
module.exports.default = module.exports;

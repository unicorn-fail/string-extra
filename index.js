// Node.js.
const util = require('util');
const Stream = require('stream');

// Modules.
const { sprintf } = require('sprintf-js');
// noinspection JSUnresolvedVariable

const StringJs = require('string');
const StringJsConstructor = StringJs('').constructor;

// Unfortunately, the static methods and properties are exported separately
// and not members of the constructor; merge them in.
Object.keys(StringJs).filter(p => StringJs.hasOwnProperty(p)).forEach(p => StringJsConstructor[p] = StringJs[p]);

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
class StringExtra extends StringJsConstructor {

  /**
   * Constructs a new StringExtra object.
   *
   * @param {*} [value = '']
   *   The value to use.
   * @param {...*} [args = []]
   *   The placeholder values.
   */
  constructor(value = '', ...args) {
    // Initialize with a blank string so it doesn't convert the original value.
    super('');
    this.orig = value;
    this.args(...args);
    this.config({});
  }

  /**
   * Custom Node.js inspection, used mainly for console.log().
   *
   * @return {String}
   */
  [util.inspect.custom]() {
    return this.s;
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
   */
  static create(value = '', ...args) {
    const S = this || StringExtra;
    if (value instanceof S) {
      return value;
    }
    return new S(value, ...args);
  }

  static extendPrototype() {
    // Immediately return if already extended.
    if (extendedPrototype.length) {
      return;
    }

    const _this = this;
    const proto = this.prototype;

    const storedStrings = _private(this);
    const applyMethod = (string, method, args) => {
      const original = string;
      if (!storedStrings[string]) {
        storedStrings[string] = _this.create(string);
      }
      const instance = storedStrings[string];
      const newString = method.apply(instance, args).s;
      delete storedStrings[original];
      storedStrings[newString] = instance;
      return newString;
    };

    // Only fill in the missing properties.
    const StringProto = Object.keys(Object.getOwnPropertyDescriptors(String.prototype));
    const StringJsProto = Object.keys(Object.getOwnPropertyDescriptors(StringJsConstructor.prototype));
    const StringExtraProto = Object.keys(Object.getOwnPropertyDescriptors(this.prototype));
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

  /**
   * Extracts the placeholders from a value.
   *
   * @param {String|Array} value
   *   The value to check.
   *
   * @return {String[]}
   *   An array of placeholders, if any.
   */
  static extractPlaceholders(value) {
    if (typeof value === 'string') {
      const match = value.match(this.sprintfPlaceholders);
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
      const match = value.match(this.sprintfPlaceholders);

      // Ensure that there are enough placeholder values.
      if (match && match.length >= args.length) {
        return match;
      }
    }

    return [];
  }

  /**
   * Formats a value based on provided arguments and configuration.
   *
   * @param {*} value
   *   The value to format.
   * @param {Array} [args = []]
   *   An array of placeholder values to use when formatting the value.
   * @param {Object<StringExtraConfig>} config
   *   The configuration to use.
   *
   * @return {String}
   *   The formatted string.
   */
  static format(value, args, config) {
    // Immediately return if a null value.
    if (value === null) {
      return config.nullAsEmptyString ? '' : 'null';
    }

    let _this = this;

    // Support the array sprintf syntax, e.g. ['Format %s', 'value'].
    // Note: this requires the first array argument to be a string or an object
    // that converts to a string using toString(). It must also contain greater
    // than or equal subsequent placeholder values in the array to match the
    // corresponding placeholders in the string.
    let placeholders;
    let string = Array.isArray(value) && (placeholders = this.extractPlaceholders(value)).length ? value[0] : value;
    if (!placeholders) {
      placeholders = StringExtra.extractPlaceholders(string);
    }

    if (typeof value === 'string' && args.length) {
      // If there's a chalk style applied to the whole string, then closing
      // this argument will remove it from the string. The beginning style of
      // the original chalk style needs to be appended.
      if (config.color && config.argStyle) {
        // Replace non-string placeholders with %s.
        const escapedPlaceholders = unique(placeholders.filter(p => p !== '%s')).map(_this.escapeRegExp);
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
            args[index] = _this.inspect(args[index], config);
          }
          // Convert the placeholder value. This is needed so that any
          // numerical formatting still happens; which requires the raw value.
          else if (placeholder !== '%s') {
            args[index] = sprintf(placeholder, args[index]);
          }

          // Now, style it accordingly and replace the placeholder with %s.
          const p = _this.create(args[index]).style(config.argStyle);
          args[index] = config.style ? chalk.wrap(p, config.style) : p;
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
          string = this.inspect(value, config);
      }
    }

    if (config.color && typeof config.style === 'function') {
      string = config.style(string);
    }

    // Replace final placeholders with values (must happen after styling).
    if (args.length) {
      string = sprintf(string, ...args);
    }

    return `${config.prefix}${string}${config.suffix}`;
  }

  static formatTheme(string, theme = [], styleSpaces = false) {
    const placeholders = this.extractPlaceholders(string);
    const chars = string.split('');
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

  static attachCustomInspector(value, config) {
    if (!Array.isArray(value) && typeof value === 'object' && value && !value[util.inspect.custom]) {
      value[util.inspect.custom] = (depth, options) => {
        return this.customInspector(value, Object.assign({}, config.inspectorConfig, options));
      };
    }

    // Immediately return if there is no depth.
    if (!config.inspectorConfig || (!config.inspectorConfig.depth && config.inspectorConfig.depth !== null && config.inspectorConfig.depth !== Infinity)) {
      return;
    }

    // Recursively attach inspector on sub-properties.
    const properties = Object.keys(value).filter(p => value.hasOwnProperty(p) && !Array.isArray(value[p]) && typeof value[p] === 'object');
    const newConfig = Object.assign({}, config, {
      inspectorConfig: Object.assign({}, config.inspectorConfig, {
        depth: config.inspectorConfig.depth === null ? null : config.inspectorConfig.depth - 1
      })
    });
    for (let i = 0, l = properties.length; i < l; i++) {
      this.attachCustomInspector(value[properties[i]], newConfig);
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
    let _this = this;
    streams.forEach(stream => {
      if (stream instanceof Stream.Writable) {
        // noinspection JSUndefinedPropertyAssignment, JSUnresolvedVariable
        stream.stringExtraOriginalWrite = stream.write;
        // noinspection JSUndefinedPropertyAssignment
        stream.write = function(data, ...args) {
          if (data instanceof _this) {
            data = data.b;
          }
          // noinspection JSUnresolvedVariable
          stream.stringExtraOriginalWrite.call(this, data, ...args);
        };
      }
    });
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

  static inspect(value, config) {
    if (typeof config.inspector !== 'function') {
      throw new TypeError('Provided inspector is not a callable function.');
    }
    this.attachCustomInspector(value, config);
    return this.create(config.inspector.call(value, value, config.inspectorConfig, this));
  }

  static customInspector(value, config) {
    const name = value.constructor.name !== 'Object' ? config.stylize(value.constructor.name, 'special') : '';

    // Immediately return if there is no depth.
    if (!config.depth && config.depth !== null && config.depth !== Infinity) {
      return name ? `[${name}]` : config.stylize(value.constructor.name, 'special');
    }

    const newline = config.compact ? '' : '\n';

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

    const newOptions = Object.assign({}, config, {
      depth: config.depth === null ? null : config.depth - 1
    });

    // Separator is based on whether it should be compact or not. If it's
    // compact, it's just a space. If it's not compact, then it's a newline
    // and some padding.
    const separator = config.compact ? ' ' : `${newline}  `;
    const inner = properties.map(p => {
      const v = this.customInspector(value[p], newOptions).replace(/\r\n|\n/g, `,${separator}`);
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
      const placeholders = this.constructor.extractPlaceholders(this.orig);
      args = placeholders ? [...args].concat(Array.isArray(this.orig) ? this.orig.slice(1) : []).slice(0, placeholders.length) : [];
    }
    _private(this).args = args;
    return this;
  }

  /**
   * Retrieves or sets configuration.
   *
   * @param {String|StringExtraConfig} [name]
   *   The name of the config object to retrieve/set. If not set, the entire
   *   config object will be returned. If an object, it will merge any
   *   key/value pair configuration passed.
   * @param {*} [value]
   *   The value of the config object to set. If not provided, the current set
   *   value will be returned.
   *
   * @return {StringExtra|StringExtraConfig|*}
   *   If both name and value are provided, this is in "set" mode and the
   *   StringExtra instance will be returned as a result. If name was provided,
   *   but not value, this will return whatever value is currently set for name.
   *   If neither name nor value is provided, the entire config object is
   *   returned.
   */
  config(name, value) {
    const pvt = _private(this);
    const config = pvt.config || {...this.constructor.defaultConfig};
    if (typeof name === 'object') {
      pvt.config = {...config, name};
    }
    else {
      if (name === undefined) {
        return config;
      }
      if (value === undefined) {
        return config[name];
      }
      config[name] = value;
    }
    return this.resetFormatted();
  }

  /**
   * @return {StringExtra}
   */
  prefix(value, delimiter = new this.constructor(' ')) {
    this.resetFormatted();
    if (!value) {
      return this;
    }
    if (!(value instanceof this.constructor)) {
      value = new this.constructor(value);
    }
    if (delimiter !== null) {
      if (!(delimiter instanceof this.constructor)) {
        delimiter = new this.constructor(delimiter);
      }
      value.suffix(delimiter, null);
    }
    return this.config('prefix', value);
  }

  /**
   * @return {StringExtra}
   */
  resetFormatted() {
    delete _private(this).formatted;
    return this;
  }

  /**
   * @return {StringExtra}
   */
  style(style, reset = false) {
    const activeStyle = this.config('activeStyle');
    let argStyle;
    if (style) {
      let existing = reset ? chalk.native : this.config(activeStyle);
      if (!existing) {
        existing = chalk.native;
      }
      if (typeof style === 'string') {
        const styles = style.split('.argStyle.');
        style = chalk.pipe(styles[0], existing);
        if (styles[1]) {
          argStyle = styles[1];
        }
      }
      if (Array.isArray(style)) {
        const theme = style;
        style = (string) => existing(string === chalk.styleDelimiter ? string : this.constructor.formatTheme(string, theme, this.config('styleSpaces')));
      }
      if (typeof style !== 'function') {
        throw new TypeError('Provided style must either be a string of chalk styles, piped using dot notation or a function that will be passed a single string value.');
      }
    }

    // Set the current active style.
    this.resetFormatted().config(activeStyle, style);

    // Set the argument style, if any (deferred pipe string).
    if (activeStyle === 'style' && argStyle) {
      return this.argStyle.style(argStyle);
    }

    return this;
  }

  /**
   * @return {StringExtra}
   */
  suffix(value, delimiter = new this.constructor(' ')) {
    this.resetFormatted();
    if (!value) {
      return this;
    }
    if (!(value instanceof this.constructor)) {
      value = new this.constructor(value);
    }
    if (delimiter !== null) {
      if (!(delimiter instanceof this.constructor)) {
        delimiter = new this.constructor(delimiter);
      }
      value.prefix(delimiter, null);
    }
    return this.resetFormatted().config('suffix', value);
  }

}

Object.defineProperty(StringExtra.prototype, 'argStyle', {
  get : function() {
    this.config('activeStyle', 'argStyle');
    return this.resetStyle;
  },
  enumerable : true,
  configurable : false
});

Object.defineProperty(StringExtra.prototype, 'b', {
  get : function() {
    return Buffer.from(this.s, this.config('encoding'));
  },
  enumerable : true,
  configurable : false
});

Object.defineProperty(StringExtra.prototype, 'json', {
  get : function() {
    return this.config('inspector', value => JSON.stringify(value));
  },
  enumerable : true,
  configurable : false
});

Object.defineProperty(StringExtra.prototype, 'length', {
  get : function() {
    return this.s.length;
  },
  enumerable : true,
  configurable : false
});

Object.defineProperty(StringExtra.prototype, 'resetStyle', {
  get : function() {
    return this.style(null, true);
  },
  enumerable : true,
  configurable : false
});

Object.defineProperty(StringExtra.prototype, 's', {
  get : function() {
    const pvt = _private(this);

    // Immediately return any formatted result currently set.
    if (typeof pvt.formatted === 'string') {
      return pvt.formatted;
    }

    pvt.formatted = this.constructor.format(this.orig, pvt.args, pvt.config);

    return pvt.formatted;
  },
  set: function (value) {
    _private(this).s = value;
  },
  enumerable : true,
  configurable : false
});

// Support chainable chalk properties by proxying the style method.
const chalkProperties = [].concat(chalk.modifiers, chalk.fg, chalk.bg);
for (let i = 0, l = chalkProperties.length; i < l; i++) {
  let prop = chalkProperties[i];
  // Skip properties already set or non-existent on Chalk.
  if (StringExtra.prototype.hasOwnProperty(prop) || typeof chalk.native[prop] !== 'function') {
    continue;
  }

  Object.defineProperty(StringExtra.prototype, prop, {
    get : function() {
      let style = this.config(this.config('activeStyle')) || chalk.native;
      return this.style(style[prop]);
    },
    enumerable : true,
    configurable : false
  });
}

/**
 * @type {Object<StringExtraConfig>}
 */
StringExtra.defaultConfig = {
  activeStyle: 'style',
  argStyle: chalk.native.bold.whiteBright,
  color: !!(chalk.native.enabled && chalk.native.supportsColor && chalk.native.level),
  encoding: 'utf-8',
  inspector: util.inspect,
  inspectorConfig: {
    depth: 1,
    colors: !!(chalk.native.enabled && chalk.native.supportsColor && chalk.native.level),
    compact: true,
  },
  nullAsEmptyString: true,
  prefix: '',
  style: undefined,
  styleSpaces: false,
  suffix: '',
};

StringExtra.defaultStyles = {
  america: ['red', 'whiteBright', 'blue'],
  header: 'whiteBright.bold.underline',
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

module.exports.StringExtra = StringExtra;

// Support object destructuring by providing a BC alias.
module.exports.S = StringExtra.create;

// Support ES6 import/typescript.
module.exports.default = module.exports;

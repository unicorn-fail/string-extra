const util = require('util');

const chalk = require('./chalk.js').default;
const { sprintf } = require('sprintf-js');
const StringJs = require('string')('').constructor;


// Until private variables are supported by Node natively, use WeakMaps.
// Shamelessly copied from https://www.npmjs.com/package/prv
const _private = (() => {
  const p = new WeakMap();
  return o => {
    if (!p.has(o)) p.set(o, {});
    return p.get(o)
  }
})();

class StringExtra extends StringJs {

  constructor(value = '', ...args) {
    super('');

    // Support the array sprintf syntax, e.g. ['Format %s', 'value'].
    // If the value contains a sprintf placeholders, convert the value
    // to an array and use the arguments passed to the function as values.
    const placeholders = this.constructor.determinePlaceholders(value);
    this.orig = Array.isArray(value) && placeholders.length ? value[0] : value;
    _private(this).args = placeholders ? [...args].concat(Array.isArray(value) ? value.slice(1) : []).slice(0, placeholders.length) : [];
    _private(this).formatted = null;
    _private(this).config = {...this.constructor.defaultConfig};
  }

  static determinePlaceholders(value) {
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

  static determineStyle(style, existing = chalk.native) {
    if (!style) {
      return null;
    }
    if (typeof style === 'string') {
      return chalk.pipe(style, existing);
    }
    if (typeof style !== 'function') {
      throw new TypeError('Provided style must either be a string of chalk styles, piped using dot notation or a function that will be passed a single string value.');
    }
    return style;
  }

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

  static format(value, args, config) {
    let string = value;

    if (typeof value === 'string' && args.length) {
      // If there's a chalk style applied to the whole string, then closing
      // this argument will remove it from the string. The beginning style of
      // the original chalk style needs to be appended.
      if (config.color && config.argStyle) {
        const placeholders = StringExtra.determinePlaceholders(string).map(this.escapeRegExp);
        const regExp = new RegExp(placeholders.join('|'), 'g');
        string = string.replace(regExp, placeholder => {
          let p = new this(placeholder).style(config.argStyle);
          return config.style ? chalk.wrap(p, config.style) : p;
        });
      }

      // Format placeholders.
      string = sprintf(string, ...args);
    }
    else {
      switch (typeof value) {
        case 'boolean':
        case 'number':
        case 'string':
          string = `${value}`;
          break;

        default:
          string = util.inspect(value, {
            depth: 2,
            colors: config.color,
            compact: config.inline,
          });
      }
    }

    if (config.color && config.style) {
      string = config.style(string);
    }

    return `${config.prefix}${string}${config.suffix}`;
  }

  /**
   * @return {StringExtra}
   */
  config(name, value) {
    const config = _private(this).config;
    if (name === undefined) {
      return config;
    }
    if (value === undefined) {
      return config[name];
    }
    config[name] = value;
    return this.resetFormatted();
  }

  /**
   * @return {StringExtra}
   */
  inline(inline = true) {
    return this.resetFormatted().config('inline', !!inline);
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
  style(style, reset = false) {
    const activeStyle = this.config('activeStyle');
    if (style) {
      const fn = reset ? chalk.native : this.config(activeStyle);
      style = this.constructor.determineStyle(style, fn);
    }
    return this.resetFormatted().config(activeStyle, style);
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

  resetFormatted() {
    _private(this).formatted = null;
    return this;
  }

}

Object.defineProperty(StringExtra.prototype, 'args', {
  get : function() {
    this.config('activeStyle', this.config('activeStyle') === 'style' ? 'argStyle' : 'style');
    return this.resetStyle;
  },
  enumerable : false,
  configurable : false
});

Object.defineProperty(StringExtra.prototype, 'length', {
  get : function() {
    return this.s.length;
  },
  enumerable : false,
  configurable : false
});

Object.defineProperty(StringExtra.prototype, 'resetStyle', {
  get : function() {
    return this.style(null, true);
  },
  enumerable : false,
  configurable : false
});

Object.defineProperty(StringExtra.prototype, 's', {
  get : function() {
    const pvt = _private(this);

    // Immediately return any formatted result currently set.
    if (pvt.formatted !== null) {
      return pvt.formatted;
    }

    pvt.formatted = this.constructor.format(this.orig, pvt.args, pvt.config);

    return pvt.formatted;
  },
  set: function (value) {
    _private(this).s = value;
  },
  enumerable : false,
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
    enumerable : false,
    configurable : false
  });
}

StringExtra.defaultConfig = {
  activeStyle: 'style',
  argStyle: chalk.native.bold.whiteBright,
  color: !!(chalk.native.supportsColor && chalk.native.level),
  inline: true,
  prefix: '',
  style: null,
  suffix: '',
};

StringExtra.sprintfPlaceholders = /(%[-.\d]*[A-Za-z])/g;

function factory(value) {
  if (value instanceof StringExtra) {
    return value;
  }
  return new StringExtra(...arguments);
}

// Support easier extension by exposing the class on the factory.
factory.StringExtra = StringExtra;

module.exports = factory;

// Support ES6 import/typescript.
module.exports.default = factory;

// Support object destructuring by providing a BC alias.
module.exports.S = factory;

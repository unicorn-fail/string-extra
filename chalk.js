const Chalk = require('chalk').default;

/**
 * @extends Chalk
 */
const chalk = Object.assign({
  native: Chalk,
  pipe: require('chalk-pipe'),
  modifiers: [
    'reset',
    'bold',
    'dim',
    'italic',
    'underline',
    'inverse',
    'hidden',
    'strikethrough',
  ],
  fg: [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
    'gray',
    'grey',
    // The "blackBright" style doesn't actually exist currently.
    // @see https://github.com/chalk/ansi-styles/issues/48
    // @see https://github.com/chalk/chalk/issues/257
    // 'blackBright',
    'redBright',
    'greenBright',
    'yellowBright',
    'blueBright',
    'magentaBright',
    'cyanBright',
    'whiteBright',
  ],
  bg: [
    'bgBlack',
    'bgRed',
    'bgGreen',
    'bgYellow',
    'bgBlue',
    'bgMagenta',
    'bgCyan',
    'bgWhite',
    'bgBlackBright',
    'bgRedBright',
    'bgGreenBright',
    'bgYellowBright',
    'bgBlueBright',
    'bgMagentaBright',
    'bgCyanBright',
    'bgWhiteBright',
  ],
  styleDelimiter: '>>><<<',
  styleEnd(style) {
    return style ? style(this.styleDelimiter).split(this.styleDelimiter)[1] : '';
  },
  styleStart(style) {
    return style ? style(this.styleDelimiter).split(this.styleDelimiter)[0] : '';
  },
  wrap(value, existingStyle) {
    const reset = existingStyle ? this.styleStart(Chalk.reset) : '';
    return `${this.styleEnd(existingStyle)}${reset}${value}${reset}${this.styleStart(existingStyle)}`;
  }
}, Chalk);

module.exports = chalk;
module.exports.default = module.exports;

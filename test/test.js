const assert = require('assert');
const describe = require('mocha').describe;

const chalk = require('../chalk').default;
const C = chalk.native;

const test = 'test';
const format = 'Test %s';

const { S, StringExtra } = require('../index.js');

assert.stringExtra = (actual, expected) => {
  assert.strictEqual(actual instanceof StringExtra, true);
  if (expected !== undefined) {
    assert.strictEqual(actual.s, expected);
    assert.strictEqual(actual.toString(), expected);
    assert.strictEqual(`${actual}`, expected);
  }
  return assert;
};

describe('StringExtra', function() {

  it('should return a StringExtra object which can be typecast to a string', function() {
    const actual = S(test);
    assert.stringExtra(actual, test);
  });

});

describe('StringExtra#chalk', function() {

  const chalkProperties = [].concat(chalk.modifiers, chalk.fg, chalk.bg);
  for (let i = 0, l = chalkProperties.length; i < l; i++) {
    let prop = chalkProperties[i];
    it(`should chain the "${prop}" chalk property`, function() {
      const actual = S(test)[prop];
      const expected = C[prop](test);
      assert.stringExtra(actual, expected);
    });
  }

});

describe('StringExtra.style', function() {

  it('should allow piped chalk styles', function() {
    const actual = S(test).blue.dim.italic;
    const expected = C.blue.dim.italic(test);
    assert.stringExtra(actual, expected);
  });

  it('should allow piped chalk styles to be reset', function() {
    let actual = S(test).blue.dim.italic;
    let expected = C.blue.dim.italic(test);
    assert.stringExtra(actual, expected);

    // Ensure chalk's "reset" property works as expected.
    actual = actual.reset.bgRed.whiteBright.bold;
    expected = C.blue.dim.italic.reset.bgRed.whiteBright.bold(test);
    assert.stringExtra(actual, expected);

    // Ensure this module's "resetStyle" property works as expected.
    actual = actual.resetStyle.bgRed.whiteBright.bold;
    expected = C.bgRed.whiteBright.bold(test);
    assert.stringExtra(actual, expected);
  });

  it('should allow piped chalk styles represented as a string', function() {
    const actual = S(test).style('red.bold.underline');
    const expected = C.red.bold.underline(test);
    assert.stringExtra(actual, expected);
  });

  it('should allow a chained chalk function', function() {
    const actual = S(test).style(C.red.bold.underline);
    const expected = C.red.bold.underline(test);
    assert.stringExtra(actual, expected);
  });

  it('should allow a custom function', function() {
    const actual = S(test).style(v => `%${v}%`);
    const expected = `%${test}%`;
    assert.stringExtra(actual, expected);
  });

  it('should throw an error when provided style is invalid', function() {
    const actual = S(test);
    const expected = new TypeError('Provided style must either be a string of chalk styles, piped using dot notation or a function that will be passed a single string value.');
    assert.stringExtra(actual).throws(actual.style.bind(actual, {}), expected);
  });

});

describe('StringExtra.prefix', function() {

  it('should return a prefixed string', function() {
    const actual = S(test).prefix('prefix');
    const expected = `prefix ${test}`;
    assert.stringExtra(actual, expected);
  });

  it('should return a styled prefixed string using piped chalk styles', function() {
    const actual = S(test).prefix(S('prefix').red.bold.underline);
    const expected = `${C.red.bold.underline('prefix')} ${test}`;
    assert.stringExtra(actual, expected);
  });

});

describe('StringExtra.suffix', function() {

  it('should return a suffixed string', function() {
    const actual = S(test).suffix('suffix');
    const expected = `${test} suffix`;
    assert.stringExtra(actual, expected);
  });

  it('should return a styled suffixed string using piped chalk styles', function() {
    const actual = S(test).suffix(S('suffix').red.bold.underline);
    const expected = `${test} ${C.red.bold.underline('suffix')}`;
    assert.stringExtra(actual, expected);
  });

});

// describe('StringExtra.args', function() {
//
//   it('should set active styling to args', function() {
//     const actual = S(format, test).magenta.argStyle.cyanBright.bold.underline;
//     const expected = C.magenta(`Test ${chalk.wrap(C.cyanBright.bold.underline(test), C.magenta)}`);
//     assert.stringExtra(actual, expected);
//   });
//
// });

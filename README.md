# string-extra

> [![Build Status](https://travis-ci.org/unicorn-fail/string-extra.svg)](https://travis-ci.org/unicorn-fail/string-extra)
>
> Extends [string.js] with extra functionality, like [chalk] and [sprintf] support.

## Usage

> It is recommended that you read the existing documentation for [string.js] first.

The following examples use `S` as the variable name shorthand for creating new
`StringExtra` objects, however you can choose whichever name you like (e.g. `$$`).

**Node.js:**
```js
const { create: S } = require('@unicorn-fail/string-extra').default;
```

**ES6/TypeScript:**
```js
import { create as S } from '@unicorn-fail/string-extra';
```

Simple usage:
```js
S(['Placeholders %s can have their own %s too!', 'values', 'styles']).magenta.argStyle.cyanBright.bold.underline;
S(['Object value: %j', object]).magenta.prefix(S('debug').cyan.bgBlackBright).suffix(S(['(elapsed time: %s)', elapsedTime]).dim);
```

**Q:** Why not just use ES6 interpolation?  
**A:** Chainability and portability but also for the sake of brevity and
simplicity. The entire string and placeholders are styled independently and
formatted only when the object needs to be rendered to an actual string. This
allows the object to be passed around more easily and allows dynamic updates
to the format value, placeholders values (args), or styles throughout a given
workflow (think task runners/loggers where lines can have multiple states).
If you needed to update a string using interpolation, you'd have to manually
construct something like the following each and every time something changed:

```js
chalk.magenta(`Placeholders ${chalk.cyanBright.bold.underline('values')} can have their own ${chalk.cyanBright.bold.underline('styles')} too!`);
chalk.cyan.bgBlackBright('debug') + ' ' + chalk.magenta(`Object value: ${chalk.whiteBright.bold(JSON.stringify(object))}`) + ' ' + chalk.dim(`(elapsed time: ${chalk.whiteBright.bold(elapsedTime)}`);
```

## Examples

`$ node examples.js` ([see file](examples.js)):
![examples.js](examples.png)


Methods
-------

See the [test file](test/test.js) or [TypeScript definition](index.d.ts) for more details.

`@todo - finish documenting new methods/properties`


License
-------

[Licensed under MIT](LICENSE)


[string.js]: https://github.com/jprichardson/string.js
[chalk]: https://github.com/chalk/chalk
[sprintf]: https://github.com/alexei/sprintf.js

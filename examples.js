const S = require('./index.js').default;
const obj = { inline: 'object' };
console.log(S('This supports %s placeholders that %s to %s.', 'multiple', 'default', 'bold bright white').red.s);
console.log(S('Does it support numeric %d, %i, %.03f and other basic placeholders as well? %t', -42.123456789, 42.123456789, 42.123456789, true).yellow.s);
console.log(S('Have a simple %T? It supports inline JSON %j placeholders too.', obj, obj).green.s);
console.log(S('Strings can have a prefix or a suffix values with their own styles! %s', '(useful for logging)').blue.args.dim.prefix(S('[prefix]').bgBlack.whiteBright.bold).suffix(S('[suffix]').bgBlack.whiteBright.bold).s);
console.log(S('Placeholders %s can have the own %s too!', 'values', 'styles').magenta.args.cyanBright.bold.underline.s);

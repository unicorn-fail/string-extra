const { create:S, StringExtra } = require('./index').default;

class Unicorn {
  constructor() {
    this.testing = {
      one: {
        two: {
          three: {
            four: {
              five: true
            }
          }
        }
      }
    };
  }
}

const unicorn = new Unicorn();

const examples = {
  "Placeholders / Chalk": [
    S(['%s supports multiple %s that %s to %s and can be passed directly to %s.', 'StringExtra', 'placeholders', 'default', 'bold bright white', 'console.log()']).red,
    S(['Does it support numeric %d, %i, %.03f and other basic placeholders as well? %t', -42.123456789, 42.123456789, 42.123456789, true]).yellow,
    S(['Have a complex %T? No fret, inspect them inline up to 1 level deep with the %s placeholder: %j', unicorn, '%j', unicorn]).green,
    S(['Want to use JSON instead? Use the %s placeholder along with the %s property: %j.', '%j', '.json', { simple: 'object' }]).json.cyan,
    S(['Strings can have a prefix or a suffix values with their own styles! %s', '(useful for logging)']).blue.argStyle.dim.prefix(S('[prefix]').bgBlack.whiteBright.bold).suffix(S('[suffix]').bgBlack.whiteBright.bold),
    S(['Placeholders %s can have their own %s too!', 'values', 'styles']).magenta.argStyle.cyanBright.bold.underline,
  ],
  "S().b (buffer)": () => {
    process.stdout.write(S(['  Invoke %s to allow %s instances to be written directly to any stream as a %s instance.\n', 'S().b', 'StringExtra', 'Buffer']).blue.b);
  },
  "StringExtra.extendPrototype()": () => {
    StringExtra.extendPrototype();
    console.log('  Invoke %s to extend %s so that %s can support all %s functionality!'.args('StringExtra.extendPrototype()', 'String.prototype', 'string literals (e.g. \'\')', 'StringExtra').magenta);
    StringExtra.restorePrototype();
  },
  "StringExtra.hookStream()": () => {
    StringExtra.hookStream(process.stdout);
    process.stdout.write(S(['  Invoke %s if you want to avoid having to use %s or %s all the time, e.g.: %s.\n', 'StringExtra.hookStream()', 'S().s', 'S().b', 'StringExtra.hookStream(process.stdout, process.stderr)']).green);
    StringExtra.unhookStream(process.stdout);
  },
  "Pre-defined styles (themes)": [
    S('America, Heck Yeah!').america,
    S(['Merry Christmas %s! Ho ho ho!', 'testing']).christmas,
    S('Somewhere over the rainbow...').rainbow,
    S(['Zebra striping with %s styled independently.', 'arguments']).zebra.argStyle.green.zebra,
  ],
  "Custom Styles": [
    S('Completely custom styling using your own array of styles that alternate between letters.').style(['blue.underline', 'pink.underline']).setOption('styleSpaces', true),
  ],
};

for (let label in examples) {
  const data = examples[label];
  console.log();
  console.log(S(label).header);
  console.log();
  if (typeof data === 'function') {
    data();
  }
  else {
    [].concat(data).forEach(string => process.stdout.write('  ') && console.log(string));
  }
}



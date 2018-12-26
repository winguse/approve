const vueParser = require('vue-parser');
const tsLintLoader = require('tslint-loader');

module.exports = function(input, map) {
  const that = Object.assign({}, this, {
    async: () => {
      const cb = this.async();
      return function (err, _input, map) {
        cb(err, input, map);
      };
    }
  });
  if (/<script lang=(ts|"ts"|'ts')>([\s|\S]*)<\/script>/.test(input)) {
    const _input = vueParser.parse(input, 'script', { lang: ['ts', 'tsx'] });
    // throw new Error(_input)
    tsLintLoader.apply(that, [_input, map]);
  } else {
    tsLintLoader.apply(that, [input, map]);
  }
};

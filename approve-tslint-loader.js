const vueParser = require('vue-parser');
const tsLoader = require('tslint-loader');

module.exports = function(input, map) {
  const that = this;
  const func = tsLoader.bind(Object.assign({}, that, {
    async: function() {
      const cb = that.async();
      return function (err, _input, map) {
        cb(err, input, map);
      };
    }
  }));
  if (/<script lang=(ts|"ts"|'ts')>([\s|\S]*)<\/script>/.test(input)) {
    const _input = vueParser.parse(input, 'script', { lang: ['ts', 'tsx'] });
    // throw new Error(_input)
    func(_input, map);
  } else {
    func(input, map);
  }
};

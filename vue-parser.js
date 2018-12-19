const vueParser = require('vue-parser');
const tsLoader = require('ts-loader');


// module.exports = function(input, map) {
//   this.cacheable && this.cacheable();
//   var callback = this.async();

//   if (!semver.satisfies(Lint.Linter.VERSION, '>=4.0.0')) {
//     throw new Error('Tslint should be of version 4+');
//   }

//   var options = resolveOptions(this);
//   lint(this, input, options);
//   callback(null, input, map);
// };

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

  if (/<script>([\s|\S]*)<\/script>/.test(input)) {
    const _input = vueParser.parse(input, 'script', { lang: ['ts', 'tsx'] });
    func(_input, map);
  } else {
    func(input, map);
  }
};

# @seldszar/vue-entry-loader

> Yet another Vue entry loader for Webpack

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Author](#author)
- [License](#license)

# Install

```bash
$ npm install @seldszar/vue-entry-loader
```

# Usage

```javascript
const { VueEntryPlugin } = require('@seldszar/vue-entry-loader');

module.exports = {
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader'
			}
		]
	},
	plugins: [new VueLoaderPlugin(), new VueEntryPlugin()]
};
```

## Author

Alexandre Breteau - [@0xSeldszar](https://twitter.com/0xSeldszar)

## License

MIT © [Alexandre Breteau](https://seldszar.fr)

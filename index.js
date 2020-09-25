const loaderUtils = require('loader-utils');
const path = require('path');
const querystring = require('querystring');
const validateOptions = require('schema-utils');

const loaderSchema = {
	additionalProperties: false,
	type: 'object',
	properties: {
		template: {
			type: 'string'
		},
		selector: {
			type: 'string'
		}
	}
};

function generateServer(context, codeSegment) {
	return `
		import Vue from "vue";

		${codeSegment}

		import App from ${JSON.stringify(context.resourcePath)};

		export default async options => {
			const rootOptions =
				typeof codeSegment === "function"
					? await codeSegment(Vue, App, "server")
					: codeSegment;

			return new Vue({
				render: h => h(App),
				...rootOptions,
				...options,
			});
		};
	`;
}

function generateClient(context, codeSegment, options) {
	return `
		import Vue from "vue";

		${codeSegment}

		import App from ${JSON.stringify(context.resourcePath)};

		async function main() {
			const rootOptions =
				typeof codeSegment === "function"
					? await codeSegment(Vue, App, "client")
					: codeSegment;

			const vm = new Vue({
				render: h => h(App),
				...rootOptions,
			});

			if (typeof beforeMount === "function") {
				await beforeMount(vm, App);
			}

			if (typeof App.beforeMount === "function") {
				await App.beforeMount(vm);
			}

			vm.$mount(${options.selector || JSON.stringify('#app')});
		}

		main();
	`;
}

function loader() {
	const options = loaderUtils.getOptions(this) || {};

	validateOptions(loaderSchema, options, {
		name: 'Vue Entry Loader',
		baseDataPath: 'options'
	});

	let codeSegment = '';

	if (options.template) {
		const templatePath = path.resolve(this.rootContext, options.template);

		codeSegment = `
			import codeSegment, { beforeMount } from ${JSON.stringify(templatePath)};
		`;
	}

	const isServer = ['async-node', 'electron-main', 'node'].includes(
		this.target
	);
	const generate = isServer ? generateServer : generateClient;

	return generate(this, codeSegment, options);
}

function format(entry, options) {
	return `@seldszar/vue-entry-loader?${querystring.stringify(
		options
	)}!${entry}`;
}

const pluginSchema = {
	definitions: {
		Rule: {
			anyOf: [
				{
					instanceof: 'RegExp',
					tsType: 'RegExp'
				},
				{
					type: 'string',
					minLength: 1
				}
			]
		},
		Rules: {
			anyOf: [
				{
					type: 'array',
					items: {
						oneOf: [
							{
								$ref: '#/definitions/Rule'
							}
						]
					}
				},
				{
					$ref: '#/definitions/Rule'
				}
			]
		}
	},
	additionalProperties: false,
	type: 'object',
	properties: {
		template: {
			type: 'string'
		},
		selector: {
			type: 'string'
		},
		test: {
			oneOf: [
				{
					$ref: '#/definitions/Rules'
				}
			]
		}
	}
};

class VueEntryPlugin {
	constructor(options) {
		validateOptions(pluginSchema, options, {
			name: 'Vue Entry Plugin',
			baseDataPath: 'options'
		});

		this.options = {
			test: /\.vue(\?.*)?$/i,
			...options
		};
	}

	apply({options}) {
		const {entry} = options;

		options.entry =
			typeof entry === 'function' ?
				async () => this.updateEntry(await entry()) :
				this.updateEntry(entry);
	}

	testEntry(entry) {
		const testPattern = pattern =>
			pattern instanceof RegExp ? pattern.test(entry) : entry.includes(pattern);

		return Array.isArray(this.options.test) ?
			this.options.test.some(testPattern) :
			testPattern(this.options.test);
	}

	updateEntry(entry) {
		if (typeof entry === 'string' && this.testEntry(entry)) {
			return format(entry, {
				template: this.options.template,
				selector: this.options.selector
			});
		}

		if (Array.isArray(entry)) {
			for (let index = 0; index < entry.length; index++) {
				entry[index] = this.updateEntry(entry[index]);
			}
		} else if (typeof entry === 'object') {
			for (const key in entry) {
				if (Object.prototype.hasOwnProperty.call(entry, key)) {
					entry[key] = this.updateEntry(entry[key]);
				}
			}
		}

		return entry;
	}
}

module.exports = loader;
module.exports.format = format;
module.exports.VueEntryPlugin = VueEntryPlugin;

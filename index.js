const loaderUtils = require('loader-utils');
const path = require("path");
const validateOptions = require('schema-utils');

const schema = require('./options.json');

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
				await beforeMount(vm);
			}

			vm.$mount(${options.selector || JSON.stringify("#app")});
		}

		main();
	`;
}

function loader() {
	const options = loaderUtils.getOptions(this) || {};

	validateOptions(schema, options, {
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

	const isServer = ['async-node', 'electron-main', 'node'].includes(this.target);
	const generate = isServer ? generateServer : generateClient;

	return generate(this, codeSegment, options);
}

module.exports = loader;

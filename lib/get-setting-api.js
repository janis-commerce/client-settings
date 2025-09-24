'use strict';

const { API } = require('@janiscommerce/api');

const DefinitionFetcher = require('./definition-fetcher');
const { addDefaults } = require('./helpers/add-defaults');

module.exports = class GetSettingApi extends API {

	async validate() {

		this.definition = await DefinitionFetcher.load(this.settingsPath);

		const [entity] = this.pathParameters;

		if(!this.definition[entity])
			throw new Error(`Entity ${entity} has no settings defined`);
	}

	async process() {

		const [entity] = this.pathParameters;

		this.session.useClientCache = false;
		const { settings = {} } = await this.session.client;

		this.setBody(this.format(this.definition[entity], settings[entity]));
	}

	format(defaultSettings, clientSettings) {
		return addDefaults(defaultSettings, clientSettings);
	}

};

'use strict';

const { API } = require('@janiscommerce/api');

const DefinitionFetcher = require('./definition-fetcher');

module.exports = class GetSettingApi extends API {

	async validate() {

		this.definition = await DefinitionFetcher.load(this.settingsPath);

		const [entity] = this.pathParameters;

		if(!this.definition[entity])
			throw new Error(`Entity ${entity} has no settings defined`);
	}

	async process() {

		const [entity] = this.pathParameters;

		const { settings = {} } = await this.session.client;

		this.setBody(this.format(this.definition[entity], settings[entity]));
	}

	format(defaultSettings, clientSettings) {

		const settingsFormatted = {};

		Object.entries(defaultSettings).forEach(([settingName, setting]) => {
			settingsFormatted[settingName] = (clientSettings && typeof clientSettings[settingName] !== 'undefined')
				? clientSettings[settingName]
				: setting.default;
		});

		return settingsFormatted;
	}

};

'use strict';

const { API } = require('@janiscommerce/api');

const DefinitionFetcher = require('./definition-fetcher');
const ClientSettingsModel = require('./client-settings-model');

module.exports = class GetSettingApi extends API {

	async validate() {

		this.definition = await DefinitionFetcher.load(this.settingsPath);

		const [entity] = this.pathParameters;

		if(!this.definition[entity])
			throw new Error(`Entity ${entity} has no settings defined`);
	}

	async process() {

		const [entity] = this.pathParameters;

		const clientSettingsModel = this.session.getSessionInstance(ClientSettingsModel);
		const settings = await clientSettingsModel.getBy('entity', entity, { unique: true });

		this.setBody(this.format(this.definition[entity], settings));
	}

	format(defaultSettings, clientSettings) {

		const settingsFormatted = {};

		Object.entries(defaultSettings).forEach(([settingName, setting]) => {
			settingsFormatted[settingName] = (clientSettings.values && typeof clientSettings.values[settingName] !== 'undefined')
				? clientSettings.values[settingName]
				: setting.default;
		});

		return settingsFormatted;
	}

};

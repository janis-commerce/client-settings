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
		const settings = await clientSettingsModel.getBy('entity', entity);

		this.setBody(settings.reduce((acum, { name, value }) => {
			acum[name] = value;
			return acum;
		}, {}));
	}

};

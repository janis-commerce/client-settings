'use strict';

const assert = require('assert');
const { API } = require('@janiscommerce/api');
const { struct } = require('@janiscommerce/superstruct');

const DefinitionFetcher = require('./definition-fetcher');
const ClientSettingsModel = require('./client-settings-model');

module.exports = class PutSettingApi extends API {

	async validate() {

		this.definition = await DefinitionFetcher.load(this.settingsPath);

		const [entity] = this.pathParameters;

		if(!this.definition[entity])
			throw new Error(`Entity ${entity} has no settings defined`);

		this.defaultSettings = this.definition[entity];

		this.validateSettingStruct();
	}

	validateSettingStruct() {

		const structValidation = struct.partial(this.getStructObject());

		try {
			this.data = struct(structValidation)(this.data);
		} catch(error) {
			throw error;
		}

		return true;
	}

	getStructObject() {

		const settingsFormatted = {};

		Object.entries(this.defaultSettings).forEach(([settingName, setting]) => {
			settingsFormatted[settingName] = setting.struct;
		});

		return settingsFormatted;
	}

	async process() {

		const [entity] = this.pathParameters;

		const dataToSave = this.formatDataToSave(entity);

		const clientSettingsModel = this.session.getSessionInstance(ClientSettingsModel);

		return clientSettingsModel.save(dataToSave);
	}

	formatDataToSave(entity) {

		const dataToSave = {
			entity,
			values: {}
		};

		Object.entries(this.data).forEach(([settingName, settingValue]) => {
			if(!this.equalValues(settingValue, this.defaultSettings[settingName].default))
				dataToSave.values[settingName] = settingValue;
		});

		return dataToSave;
	}

	equalValues(value, test) {
		try {
			assert.deepStrictEqual(value, test);
			return true;
		} catch(e) {
			return false;
		}
	}

};

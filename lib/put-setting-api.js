'use strict';

const assert = require('assert');
const path = require('path');

const { API } = require('@janiscommerce/api');
const { struct } = require('@janiscommerce/superstruct');

const DefinitionFetcher = require('./definition-fetcher');

const clientModelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');

const isObject = param => !!(param && typeof param === 'object' && !Array.isArray(param));

module.exports = class PutSettingApi extends API {

	get model() {

		try {
			// eslint-disable-next-line global-require, import/no-dynamic-require
			const ClientModel = require(clientModelPath);
			return new ClientModel();
		} catch(error) {
			this.setCode(400);
			throw new Error(`Cannot found Model Client. Must be in ${clientModelPath}.`);
		}
	}

	async validate() {

		const definition = await DefinitionFetcher.load(this.settingsPath);

		[this.entity] = this.pathParameters;

		if(!definition[this.entity])
			throw new Error(`Entity ${this.entity} has no settings defined`);

		this.defaultSettings = definition[this.entity];

		this.validateSettingStruct();
	}

	async process() {

		const dataToSave = this.formatDataToSave();

		const response = await this.updateClientSettings(dataToSave);

		await this.postSaveHook(dataToSave);

		return response;
	}

	validateSettingStruct() {
		this.data = struct.partial(this.getStructObject())(this.data);
	}

	getStructObject() {

		return Object.entries(this.defaultSettings).reduce((settingsFormatted, [settingName, setting]) => {

			settingsFormatted[settingName] = setting.struct;
			return settingsFormatted;

		}, {});
	}

	formatDataToSave() {

		return Object.entries(this.data).reduce((dataFormatted, [settingName, settingValue]) => {

			if(this.shouldSaveSetting(settingName, settingValue))
				dataFormatted[settingName] = settingValue;

			return dataFormatted;
		}, {});
	}

	shouldSaveSetting(settingName, settingValue) {

		if(this.equalValues(settingValue, this.defaultSettings[settingName].default))
			return false;

		if(this.isEmptySetting(settingValue) && this.defaultSettings[settingName].saveEmptyValue === false)
			return false;

		return true;
	}

	equalValues(value, test) {

		try {
			assert.deepStrictEqual(value, test);
			return true;
		} catch(e) {
			return false;
		}
	}

	isEmptySetting(settingValue) {

		return !!(
			(settingValue === null) ||
			(typeof settingValue === 'string' && !settingValue) ||
			(typeof settingValue === 'number' && (Number.isNaN(Number(settingValue)) || settingValue === 0)) ||
			(Array.isArray(settingValue) && !settingValue.length) ||
			(isObject(settingValue) && !Object.keys(settingValue).length && !(settingValue instanceof Date))
		);
	}

	updateClientSettings(dataToSave) {
		return this.model.update({ [`settings.${this.entity}`]: dataToSave }, { code: this.session.clientCode });
	}

	async postSaveHook(dataToSave) {
		return dataToSave;
	}

};

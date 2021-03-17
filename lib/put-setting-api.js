'use strict';

const assert = require('assert');
const { API } = require('@janiscommerce/api');
const { struct } = require('@janiscommerce/superstruct');
const path = require('path');

const DefinitionFetcher = require('./definition-fetcher');

const clientModelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');
module.exports = class PutSettingApi extends API {

	get model() {

		try {
			// eslint-disable-next-line global-require, import/no-dynamic-require
			const ClientModel = require(clientModelPath);
			return new ClientModel();
		} catch(error) {
			this.setCode(400);
			throw new Error(`Invalid Model Client. Must be in ${clientModelPath}.`);
		}
	}

	async validate() {

		const definition = await DefinitionFetcher.load(this.settingsPath);

		const [entity] = this.pathParameters;

		if(!definition[entity])
			throw new Error(`Entity ${entity} has no settings defined`);

		this.defaultSettings = definition[entity];

		this.validateSettingStruct();
	}

	async process() {

		const [entity] = this.pathParameters;

		const dataToSave = this.formatDataToSave();

		if(!Object.keys(dataToSave).length)
			return;

		return this.model.update({ [`settings.${entity}`]: dataToSave }, { code: this.session.clientCode });
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

			if(!this.equalValues(settingValue, this.defaultSettings[settingName].default))
				dataFormatted[settingName] = settingValue;

			return dataFormatted;
		}, {});
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

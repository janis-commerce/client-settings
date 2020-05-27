'use strict';

const path = require('path');

const ClientSettingsError = require('./client-settings-error');

const DEFAULT_SETTINGS_PATH = path.resolve(process.cwd(), 'schemas/settings');

const definitions = {};

module.exports = class DefinitionFetcher {

	static getPath(customPath) {
		return customPath || DEFAULT_SETTINGS_PATH;
	}

	static async load(definitionPath) {

		if(definitions[definitionPath])
			return;

		const pathToLoad = this.getPath(definitionPath);

		try {

			/* eslint-disable global-require, import/no-dynamic-require */
			const definition = require(pathToLoad);
			/* eslint-enable */

			definitions[pathToLoad] = definition;

			return definition;

		} catch({ message }) {
			throw new ClientSettingsError(`Settings definition ${pathToLoad} not found: ${message}`, ClientSettingsError.codes.SETTING_DEFINITION_NOT_FOUND);
		}
	}

	static get(definitionPath, entity, settingName) {

		const pathToGet = this.getPath(definitionPath);

		return definitions[pathToGet] && definitions[pathToGet][entity] && definitions[pathToGet][entity][settingName];
	}

	static getDefaultValue(definitionPath, entity, settingName) {
		const setting = this.get(definitionPath, entity, settingName);

		return setting && setting.default;
	}

};

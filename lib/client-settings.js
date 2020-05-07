'use strict';

const path = require('path');

const { readFile } = require('./fs');

const ClientSettingsModel = require('./client-settings-model');
const ClientSettingsError = require('./client-settings-error');

const DEFAULT_SETTINGS_PATH = path.resolve(process.cwd(), 'schemas/settings');

const definitions = {};
const cache = {};

module.exports = class ClientSettings {

	static get settingsPath() {
		return this._settingsPath || DEFAULT_SETTINGS_PATH;
	}

	static setSession(session) {
		this.session = session;
		return this;
	}

	static setSettingsDefinitionPath(settingsPath) {
		this._settingsPath = settingsPath;
		return this;
	}

	static async get(entity, settingName) {

		if(!this.session)
			throw new ClientSettingsError('You must set a session before getting any setting', ClientSettingsError.codes.SESSION_NOT_SET);

		await this.loadDefinition();

		if(this.exists(entity, settingName))
			throw new ClientSettingsError(`Setting ${entity}.${settingName} does not exist`, ClientSettingsError.codes.SETTING_DOES_NOT_EXIST);

		const cachedValue = this.getFromCache(entity, settingName);
		if(cachedValue !== null && cachedValue !== undefined)
			return cachedValue;

		return this.getForClient(entity, settingName);
	}

	static async loadDefinition() {

		const { settingsPath } = this;

		if(definitions[settingsPath])
			return;

		try {
			definitions[settingsPath] = await readFile(settingsPath);
			cache[this.settingsPath] = {};
		} catch({ message }) {
			throw new ClientSettingsError(`Settings definition ${settingsPath} not found: ${message}`, ClientSettingsError.codes.SETTING_DEFINITION_NOT_FOUND);
		}
	}

	static getFromCache(entity, settingName) {
		return cache[this.settingsPath][entity] && cache[this.settingsPath][entity][settingName];
	}

	static exists(entity, settingName) {
		return !definitions[this.settingsPath][entity] || !definitions[this.settingsPath][entity][settingName];
	}

	static async getForClient(entity, settingName) {

		const clientSettingsModel = this.session.getSessionInstance(ClientSettingsModel);
		const setting = await clientSettingsModel.get({
			filters: { entity, name: settingName },
			limit: 1,
			unique: true
		});

		const value = setting ? setting.value : this.getDefault(entity, settingName);

		if(!cache[this.settingsPath][entity])
			cache[this.settingsPath][entity] = {};

		cache[this.settingsPath][entity][settingName] = value;

		return value;
	}

	static getDefault(entity, settingName) {

		cache[this.settingsPath][entity] = {
			[settingName]: definitions[this.settingsPath][entity][settingName].default
		};

		return cache[this.settingsPath][entity][settingName];
	}

};

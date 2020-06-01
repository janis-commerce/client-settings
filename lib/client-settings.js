'use strict';

const DefinitionFetcher = require('./definition-fetcher');
const ClientSettingsModel = require('./client-settings-model');
const ClientSettingsError = require('./client-settings-error');

const cache = {};

module.exports = class ClientSettings {

	static get settingsPath() {
		return this._settingsPath || '';
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

		if(!this.exists(entity, settingName))
			throw new ClientSettingsError(`Setting ${entity}.${settingName} does not exist`, ClientSettingsError.codes.SETTING_DOES_NOT_EXIST);

		const cachedValue = this.getFromCache(entity, settingName);
		if(cachedValue !== null && cachedValue !== undefined)
			return cachedValue;

		return this.getForClient(entity, settingName);
	}

	static async loadDefinition() {

		await DefinitionFetcher.load(this.settingsPath);

		if(!cache[this.settingsPath])
			cache[this.settingsPath] = {};
	}

	static getFromCache(entity, settingName) {
		return cache[this.settingsPath][entity] && cache[this.settingsPath][entity][settingName];
	}

	static exists(entity, settingName) {
		return !!DefinitionFetcher.get(this.settingsPath, entity, settingName);
	}

	static async getForClient(entity, settingName) {

		const clientSettingsModel = this.session.getSessionInstance(ClientSettingsModel);
		const setting = await clientSettingsModel.getBy('entity', entity, { unique: true });

		const value = setting && setting.values[settingName] ? setting.values[settingName] : this.getDefault(entity, settingName);

		if(!cache[this.settingsPath][entity])
			cache[this.settingsPath][entity] = {};

		cache[this.settingsPath][entity][settingName] = value;

		return value;
	}

	static getDefault(entity, settingName) {

		cache[this.settingsPath][entity] = {
			[settingName]: DefinitionFetcher.getDefaultValue(this.settingsPath, entity, settingName)
		};

		return cache[this.settingsPath][entity][settingName];
	}

};

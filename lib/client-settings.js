'use strict';

const NodeCache = require('node-cache');

const DefinitionFetcher = require('./definition-fetcher');
const ClientSettingsError = require('./client-settings-error');

const hourTime = 60 * 60;

const cache = {};

module.exports = class ClientSettings {

	static get cacheTime() {
		return this._cacheTime || hourTime;
	}

	static get settingsPath() {
		return this._settingsPath || '';
	}

	static setCacheTime(timeInSeconds) {
		this._cacheTime = timeInSeconds;
		return this;
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
			cache[this.settingsPath] = new NodeCache({ stdTTL: this.cacheTime });
	}

	static exists(entity, settingName) {
		return !!DefinitionFetcher.get(this.settingsPath, entity, settingName);
	}

	static getFromCache(entity, settingName) {

		if(!cache[this.settingsPath].has(entity))
			return;

		return cache[this.settingsPath].get(entity)[settingName];
	}

	static async getForClient(entity, settingName) {

		const { settings = {} } = await this.session.client;
		const clientSettings = settings[entity];

		const defaultSettings = DefinitionFetcher.getByEntity(this.settingsPath, entity);

		const settingsFormatted = this.formatSettings(defaultSettings, clientSettings);

		cache[this.settingsPath].set(entity, settingsFormatted);

		return cache[this.settingsPath].get(entity)[settingName];
	}

	static formatSettings(defaultSettings, clientSettings) {

		return Object.entries(defaultSettings).reduce((settings, [defaultSettingName, setting]) => {

			settings[defaultSettingName] = clientSettings && typeof clientSettings[defaultSettingName] !== 'undefined'
				? clientSettings[defaultSettingName]
				: setting.default;

			return settings;
		}, {});
	}

};

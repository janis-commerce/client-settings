'use strict';

const NodeCache = require('node-cache');

const DefinitionFetcher = require('./definition-fetcher');
const ClientSettingsError = require('./client-settings-error');

const hourTime = 60 * 60;

const cache = {};

module.exports = class ClientSettings {

	/**
	 * @returns {number} The time a setting will be retained in cache in seconds
	 */
	static get cacheTime() {
		return this._cacheTime || hourTime;
	}

	/**
	 * @returns {string} The path where the settings schema is defined
	 */
	static get settingsPath() {
		return this._settingsPath || '';
	}

	/**
	 * @param {number} timeInSeconds
	 * @returns {ClientSettings}
	 */
	static setCacheTime(timeInSeconds) {
		this._cacheTime = timeInSeconds;
		return this;
	}

	/**
	 * @param {import('@janiscommerce/api-session').ApiSession} session
	 * @returns {ClientSettings}
	 */
	static setSession(session) {
		this.session = session;
		return this;
	}

	/**
	 * @param {string} settingsPath The path where the settings schema is defined
	 * @returns {ClientSettings}
	 */
	static setSettingsDefinitionPath(settingsPath) {
		this._settingsPath = settingsPath;
		return this;
	}

	/**
	 * Get the value of an entity setting (client-defined or default vvalue)
	 *
	 * @param {string} entity The entity to search for
	 * @param {string} settingName The name of the setting to get
	 * @returns {*} The setting value (client-defined or default value). The returned value type depends on the setting.
	 */
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

	/**
	 * @private
	 */
	static async loadDefinition() {

		await DefinitionFetcher.load(this.settingsPath);

		if(!cache[this.settingsPath])
			cache[this.settingsPath] = new NodeCache({ stdTTL: this.cacheTime });
	}

	/**
	 * @private
	 */
	static exists(entity, settingName) {
		return !!DefinitionFetcher.get(this.settingsPath, entity, settingName);
	}

	/**
	 * @private
	 */
	static getFromCache(entity, settingName) {

		if(!cache[this.settingsPath].has(entity))
			return;

		return cache[this.settingsPath].get(entity)[settingName];
	}

	/**
	 * @private
	 */
	static async getForClient(entity, settingName) {

		const { settings = {} } = await this.session.client;
		const clientSettings = settings[entity];

		const defaultSettings = DefinitionFetcher.getByEntity(this.settingsPath, entity);

		const settingsFormatted = this.formatSettings(defaultSettings, clientSettings);

		cache[this.settingsPath].set(entity, settingsFormatted);

		return cache[this.settingsPath].get(entity)[settingName];
	}

	/**
	 * @private
	 */
	static formatSettings(defaultSettings, clientSettings) {

		return Object.entries(defaultSettings).reduce((settings, [defaultSettingName, setting]) => {

			settings[defaultSettingName] = clientSettings && typeof clientSettings[defaultSettingName] !== 'undefined'
				? clientSettings[defaultSettingName]
				: setting.default;

			return settings;
		}, {});
	}

};

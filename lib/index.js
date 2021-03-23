'use strict';

const ClientSettings = require('./client-settings');
const ClientSettingsError = require('./client-settings-error');
const ServerlessHelperHooks = require('./serverless-helper-hooks');
const GetSettingApi = require('./get-setting-api');
const PutSettingApi = require('./put-setting-api');

module.exports = {
	ClientSettings,
	ClientSettingsError,
	ServerlessHelperHooks,
	GetSettingApi,
	PutSettingApi
};

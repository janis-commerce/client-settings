'use strict';

const ClientSettings = require('./client-settings');
const ClientIndexes = require('./client-indexes');
const ClientSettingsError = require('./client-settings-error');
const ServerlessHelperHooks = require('./serverless-helper-hooks');

module.exports = {
	ClientSettings,
	ClientSettingsError,
	ClientIndexes,
	ServerlessHelperHooks
};

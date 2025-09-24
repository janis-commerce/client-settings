'use strict';

module.exports.addDefaults = (defaultSettings, clientSettings) => {
	return Object.entries(defaultSettings).reduce((settingsFormatted, [settingName, setting]) => {

		settingsFormatted[settingName] = (clientSettings && typeof clientSettings[settingName] !== 'undefined')
			? clientSettings[settingName]
			: setting.default;

		return settingsFormatted;
	}, {});
};

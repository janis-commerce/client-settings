'use strict';

const ClientSettingsModel = require('./client-settings-model');

module.exports = {

	[ClientSettingsModel.table]: [
		{
			name: 'setting',
			key: { entity: 1 },
			unique: true
		}
	]

};

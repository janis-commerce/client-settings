'use strict';

class ClientSettingsError extends Error {

	static get codes() {

		return {
			SESSION_NOT_SET: 'SESSION_NOT_SET',
			SETTING_DEFINITION_NOT_FOUND: 'SETTING_DEFINITION_NOT_FOUND',
			SETTING_DOES_NOT_EXIST: 'SETTING_DOES_NOT_EXIST'
		};

	}

	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'ClientSettingsError';
	}
}

module.exports = ClientSettingsError;

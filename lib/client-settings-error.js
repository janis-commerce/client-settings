'use strict';

class ClientSettingsError extends Error {

	static get codes() {

		return {
			SESSION_NOT_SET: 'SESSION_NOT_SET',
			SETTING_DEFINITION_NOT_FOUND: 'SETTING_DEFINITION_NOT_FOUND',
			SETTING_DOES_NOT_EXIST: 'SETTING_DOES_NOT_EXIST'
		};

	}

	/**
	 * @param {Error|string} err An error or error message
	 * @param {string} code An error code from ClientSettingsError.codes
	 */
	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'ClientSettingsError';
	}
}

module.exports = ClientSettingsError;

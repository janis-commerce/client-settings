'use strict';

const Model = require('@janiscommerce/model');

module.exports = class ClientSettingsModel extends Model {

	static get table() {
		return 'settings';
	}

	static get uniqueIndexes() {
		return [
			['entity', 'name']
		];
	}

};

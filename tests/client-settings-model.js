'use strict';

const assert = require('assert');

const Model = require('../lib/client-settings-model');

describe('Original Order Model', () => {

	describe('Getters', () => {

		it('Should not return any databaseKey', () => {
			assert.deepStrictEqual(Model.prototype.databaseKey, undefined);
		});

		it('Should return the table name', () => {
			assert.deepStrictEqual(Model.table, 'settings');
		});

		it('Should return the uniqueIndexes', async () => {
			assert.deepStrictEqual(Model.uniqueIndexes, [
				['entity', 'name']
			]);
		});

	});
});

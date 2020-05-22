'use strict';

const assert = require('assert');

const { ClientIndexes } = require('../lib');

describe('Client indexes', () => {

	it('Should export the client indexes', () => {
		assert.deepStrictEqual(ClientIndexes, {
			settings: [
				{
					name: 'setting',
					key: {
						entity: 1
					},
					unique: true
				}
			]
		});
	});

});

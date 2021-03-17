'use strict';

const mockRequire = require('mock-require');
const APITest = require('@janiscommerce/api-test');

const GetSettingApi = require('../lib/get-setting-api');
const DefinitionFetcher = require('../lib/definition-fetcher');

describe('Setting Api Get Tests', () => {

	const settingsDefinition = {
		'sample-entity': {
			'sample-setting': {
				description: 'Some setting description',
				struct: 'string',
				default: 'sample-default-value'
			},
			'other-sample-setting': {
				description: 'Some setting description',
				struct: 'number',
				default: 0
			}
		}
	};

	const settingsDefinitionFormatted = {
		'sample-setting': settingsDefinition['sample-entity']['sample-setting'].default,
		'other-sample-setting': settingsDefinition['sample-entity']['other-sample-setting'].default
	};

	const defaultDefinitionPath = DefinitionFetcher.getPath();

	context('When Entity has invalid configuration', () => APITest(GetSettingApi, '/api/setting/wrongEntity', [
		{
			description: 'Should reject if the definition file its not found',
			request: { pathParameters: ['wrongEntity'] },
			session: true,
			response: { code: 400 }
		},
		{
			description: 'Should reject if the entity not found in the definition file',
			before: () => mockRequire(defaultDefinitionPath, settingsDefinition),
			request: { pathParameters: ['wrongEntity'] },
			session: true,
			response: { code: 400 }
		}
	]));

	context('When Entity has valid configuration', () => APITest(GetSettingApi, '/api/setting/sample-entity', [
		{
			description: 'Should returns default settings if Client has not ant',
			before: () => mockRequire(defaultDefinitionPath, settingsDefinition),
			request: { pathParameters: ['sample-entity'] },
			session: true,
			response: {
				code: 200,
				body: { ...settingsDefinitionFormatted }
			}
		},
		{
			description: 'Should returns default settings if Client has other setting',
			before: () => mockRequire(defaultDefinitionPath, settingsDefinition),
			request: { pathParameters: ['sample-entity'] },
			session: true,
			client: {
				settings: {
					'other-entity': {
						'awesome-setting': 1
					}
				}
			},
			response: {
				code: 200,
				body: { ...settingsDefinitionFormatted }
			}
		},
		{
			description: 'Should returns the settings if Client has it',
			before: () => mockRequire(defaultDefinitionPath, settingsDefinition),
			request: { pathParameters: ['sample-entity'] },
			session: true,
			client: {
				settings: {
					'sample-entity': {
						'sample-setting': 'not-sample',
						'other-sample-setting': 1
					}
				}
			},
			response: {
				code: 200,
				body: {
					'sample-setting': 'not-sample',
					'other-sample-setting': 1
				}
			}
		},
		{
			description: 'Should returns the settings if Client has it but incomplete',
			before: () => mockRequire(defaultDefinitionPath, settingsDefinition),
			request: { pathParameters: ['sample-entity'] },
			session: true,
			client: {
				settings: {
					'sample-entity': {
						'other-sample-setting': 1
					}
				}
			},
			response: {
				code: 200,
				body: {
					'sample-setting': settingsDefinitionFormatted['sample-setting'],
					'other-sample-setting': 1
				}
			}
		}
	]));
});

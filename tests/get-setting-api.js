'use strict';

const mockRequire = require('mock-require');
const APITest = require('@janiscommerce/api-test');

const GetSettingApi = require('../lib/get-setting-api');
const DefinitionFetcher = require('../lib/definition-fetcher');
const ClientSettingsModel = require('../lib/client-settings-model');

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

	const clientSettings = {
		id: 'id',
		entity: 'sample-entity',
		values: {
			'non-existent-setting': 1,
			'other-sample-setting': 1
		}
	};

	const defaultDefinitionPath = DefinitionFetcher.getPath();

	APITest(GetSettingApi, '/api/setting/wrongEntity', [
		{
			description: 'Should throw if the definition file its not found',
			request: { pathParameters: ['wrongEntity'] },
			session: true,
			response: { code: 400 }
		},
		{
			description: 'Should throw if the entity not found in the definition file',
			before: () => {
				mockRequire(defaultDefinitionPath, settingsDefinition);
			},
			request: { pathParameters: ['wrongEntity'] },
			session: true,
			response: { code: 400 }
		},
		{
			description: 'Should throw if the client setting model fails getting the settings',
			before: sandbox => {
				mockRequire(defaultDefinitionPath, settingsDefinition);
				sandbox.stub(ClientSettingsModel.prototype, 'get');
				ClientSettingsModel.prototype.get.rejects();
			},
			request: { pathParameters: ['sample-entity'] },
			session: true,
			response: { code: 500 }
		}
	]);

	APITest(GetSettingApi, '/api/setting/sample-entity', [
		{
			description: 'Should returns settings OK',
			before: sandbox => {
				mockRequire(defaultDefinitionPath, settingsDefinition);
				sandbox.stub(ClientSettingsModel.prototype, 'getBy');
				ClientSettingsModel.prototype.getBy.resolves({});
			},
			request: { pathParameters: ['sample-entity'] },
			session: true,
			response: {
				code: 200,
				body: { ...settingsDefinitionFormatted }
			}
		},
		{
			description: 'Should returns the settings with including the client settings model',
			before: sandbox => {
				mockRequire(defaultDefinitionPath, settingsDefinition);
				sandbox.stub(ClientSettingsModel.prototype, 'getBy');
				ClientSettingsModel.prototype.getBy.resolves({ ...clientSettings });
			},
			request: { pathParameters: ['sample-entity'] },
			session: true,
			response: {
				code: 200,
				body: { ...settingsDefinitionFormatted, 'other-sample-setting': 1 }
			}
		}
	]);
});

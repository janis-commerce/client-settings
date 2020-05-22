'use strict';

const mockRequire = require('mock-require');
const APITest = require('@janiscommerce/api-test');

const PutSettingApi = require('../lib/put-setting-api');
const DefinitionFetcher = require('../lib/definition-fetcher');
const ClientSettingsModel = require('../lib/client-settings-model');

describe('Setting Api Put Tests', () => {

	const settingsDefinition = {
		'sample-entity': {
			'sample-setting': {
				description: 'Some setting description',
				struct: 'string?',
				default: 'sample-default-value'
			},
			'other-sample-setting': {
				description: 'Some setting description',
				struct: 'number?',
				default: 0
			}
		}
	};

	const settingsDefinitionRequestData = {
		'sample-setting': 'new-setting-value'
	};

	const defaultDefinitionPath = DefinitionFetcher.getPath();

	APITest(PutSettingApi, '/api/setting/wrongEntity', [
		{
			description: 'should throws if the definition file its not found',
			request: { data: { ...settingsDefinitionRequestData }, pathParameters: ['wrongEntity'] },
			session: true,
			before: () => {
				mockRequire('/path/to/unknown/file', undefined);
			},
			response: { code: 400 }
		},
		{
			description: 'should throws if the entity not found in the definition file',
			request: { data: { ...settingsDefinitionRequestData }, pathParameters: ['wrongEntity'] },
			session: true,
			before: () => {
				mockRequire(defaultDefinitionPath, settingsDefinition);
			},
			response: { code: 400 }
		}
	]);

	APITest(PutSettingApi, '/api/setting/sample-entity', [
		{
			description: 'should throws if the entity not found in the definition file',
			request: { data: { 'sample-setting': { foo: 'bar' } }, pathParameters: ['sample-entity'] },
			session: true,
			before: () => {
				mockRequire(defaultDefinitionPath, settingsDefinition);
			},
			response: { code: 400 }
		},
		{
			description: 'should throws if cant save into the database',
			request: { data: { ...settingsDefinitionRequestData }, pathParameters: ['sample-entity'] },
			session: true,
			before: sandbox => {
				mockRequire(defaultDefinitionPath, settingsDefinition);
				sandbox.stub(ClientSettingsModel.prototype, 'save');
				ClientSettingsModel.prototype.save.rejects();
			},
			response: { code: 500 },
			after: (response, sandbox) => {
				sandbox.assert.calledOnceWithExactly(ClientSettingsModel.prototype.save, {
					entity: 'sample-entity',
					values: { ...settingsDefinitionRequestData }
				});
			}
		},
		{
			description: 'should save the new setting',
			before: sandbox => {
				mockRequire(defaultDefinitionPath, settingsDefinition);
				sandbox.stub(ClientSettingsModel.prototype, 'save');
				ClientSettingsModel.prototype.save.resolves({ id: 'some-id' });
			},
			request: { data: { ...settingsDefinitionRequestData }, pathParameters: ['sample-entity'] },
			session: true,
			response: { code: 200 },
			after: (response, sandbox) => {
				sandbox.assert.calledOnceWithExactly(ClientSettingsModel.prototype.save, {
					entity: 'sample-entity',
					values: { ...settingsDefinitionRequestData }
				});
			}
		},
		{
			description: 'should save the new settings and exclude those that are equal to default',
			before: sandbox => {
				mockRequire(defaultDefinitionPath, settingsDefinition);
				sandbox.stub(ClientSettingsModel.prototype, 'save');
				ClientSettingsModel.prototype.save.resolves({ id: 'some-id' });
			},
			request: { data: { ...settingsDefinitionRequestData, 'other-sample-setting': 0 }, pathParameters: ['sample-entity'] },
			session: true,
			response: { code: 200 },
			after: (response, sandbox) => {
				sandbox.assert.calledOnceWithExactly(ClientSettingsModel.prototype.save, {
					entity: 'sample-entity',
					values: { ...settingsDefinitionRequestData }
				});
			}
		}
	]);
});

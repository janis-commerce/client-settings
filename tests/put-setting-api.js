'use strict';

const mockRequire = require('mock-require');
const APITest = require('@janiscommerce/api-test');
const path = require('path');

const { PutSettingApi } = require('../lib/index');
const DefinitionFetcher = require('../lib/definition-fetcher');

const clientPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');

class ClientModel {
	update() {}
}

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

	context('When Entity has invalid configuration', () => APITest(PutSettingApi, '/api/setting/wrongEntity', [
		{
			description: 'Should rejects if the definition file it is not found',
			request: {
				data: { ...settingsDefinitionRequestData },
				pathParameters: ['wrongEntity']
			},
			session: true,
			response: { code: 400 }
		},
		{
			description: 'Should rejects if the entity not found in the definition file',
			request: {
				data: { ...settingsDefinitionRequestData },
				pathParameters: ['wrongEntity']
			},
			session: true,
			before: () => mockRequire(defaultDefinitionPath, settingsDefinition),
			response: { code: 400 }
		}
	]));

	context('When Entity has valid configuration', () => APITest(PutSettingApi, '/api/setting/sample-entity', [
		{
			description: 'Should rejects if a setting value is invalid',
			request: {
				data: { 'sample-setting': { foo: 'bar' } },
				pathParameters: ['sample-entity']
			},
			session: true,
			before: () => mockRequire(defaultDefinitionPath, settingsDefinition),
			response: { code: 400 }
		},
		{
			description: 'Should rejects if Client Model is not found',
			request: {
				data: { ...settingsDefinitionRequestData },
				pathParameters: ['sample-entity']
			},
			session: true,
			before: () => mockRequire(defaultDefinitionPath, settingsDefinition),
			response: { code: 400 }
		},
		{
			description: 'Should save the new setting',
			before: sandbox => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sandbox.stub(ClientModel.prototype, 'update').resolves(1);
			},
			request: {
				data: { ...settingsDefinitionRequestData },
				pathParameters: ['sample-entity']
			},
			session: true,
			response: { code: 200 },
			after: (response, sandbox) => {
				sandbox.assert.calledOnceWithExactly(ClientModel.prototype.update, {
					'settings.sample-entity': { ...settingsDefinitionRequestData }
				}, { code: 'defaultClient' });
			}
		},
		{
			description: 'Should not save if non-value has change from default value',
			before: sandbox => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sandbox.stub(ClientModel.prototype, 'update');
			},
			request: {
				data: {
					'sample-setting': settingsDefinition['sample-entity']['sample-setting'].default,
					'other-sample-setting': settingsDefinition['sample-entity']['other-sample-setting'].default
				},
				pathParameters: ['sample-entity']
			},
			session: true,
			response: { code: 200 },
			after: (response, sandbox) => {
				sandbox.assert.notCalled(ClientModel.prototype.update);
			}
		},
		{
			description: 'Should save only the setting has change from default value',
			before: sandbox => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sandbox.stub(ClientModel.prototype, 'update').resolves(1);
			},
			request: {
				data: {
					'sample-setting': 'not-default',
					'other-sample-setting': settingsDefinition['sample-entity']['other-sample-setting'].default
				},
				pathParameters: ['sample-entity']
			},
			session: true,
			response: { code: 200 },
			after: (response, sandbox) => {
				sandbox.assert.calledOnceWithExactly(ClientModel.prototype.update, {
					'settings.sample-entity': { 'sample-setting': 'not-default' }
				}, { code: 'defaultClient' });
			}
		},
		{
			description: 'Should save only the setting is in definition file',
			before: sandbox => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sandbox.stub(ClientModel.prototype, 'update').resolves(1);
			},
			request: {
				data: {
					'sample-setting': 'not-default',
					'not-sample-setting': 120
				},
				pathParameters: ['sample-entity']
			},
			session: true,
			response: { code: 200 },
			after: (response, sandbox) => {
				sandbox.assert.calledOnceWithExactly(ClientModel.prototype.update, {
					'settings.sample-entity': { 'sample-setting': 'not-default' }
				}, { code: 'defaultClient' });
			}
		},
		{
			description: 'Should rejects if database fails updating client',
			before: sandbox => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sandbox.stub(ClientModel.prototype, 'update').rejects();
			},
			request: {
				data: { ...settingsDefinitionRequestData },
				pathParameters: ['sample-entity']
			},
			session: true,
			response: { code: 500 },
			after: (response, sandbox) => {
				sandbox.assert.calledOnceWithExactly(ClientModel.prototype.update, {
					'settings.sample-entity': { ...settingsDefinitionRequestData }
				}, { code: 'defaultClient' });
			}
		}
	]));
});

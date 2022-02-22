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
				default: 'sample-default-value',
				saveEmptyValue: false
			},
			'other-sample-setting': {
				description: 'Some setting description',
				struct: 'number?',
				default: 0,
				saveEmptyValue: true
			}
		}
	};

	const settingsDefinitionRequestData = {
		'sample-setting': 'new-setting-value'
	};

	const settingsDefinitionWithSaveEmptyValueAsFalse = {
		'sample-entity': {
			'string-sample-setting': {
				description: 'Some setting description',
				struct: 'string?',
				default: 'sample-default-value',
				saveEmptyValue: false
			},
			'number-sample-setting': {
				description: 'Some setting description',
				struct: 'number?',
				default: 1,
				saveEmptyValue: false
			},
			'object-sample-setting': {
				description: 'Some setting description',
				struct: 'object?',
				default: { 
					exampleProperty: 'exampleValue' 
				},
				saveEmptyValue: false
			},
			'array-sample-setting': {
				description: 'Some setting description',
				struct: 'array?',
				default: ['exampleItem'],
				saveEmptyValue: false
			}
		}
	};

	const emptySettingsDefinitionRequestData = {
		'string-sample-setting': '',
		'number-sample-setting': 0,
		'object-sample-setting': {},
		'array-sample-setting': []
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
			before: sinon => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sinon.stub(ClientModel.prototype, 'update').resolves(1);
			},
			request: {
				data: { ...settingsDefinitionRequestData },
				pathParameters: ['sample-entity']
			},
			session: true,
			response: { code: 200 },
			after: (response, sinon) => {
				sinon.assert.calledOnceWithExactly(ClientModel.prototype.update, {
					'settings.sample-entity': { ...settingsDefinitionRequestData }
				}, { code: 'defaultClient' });
			}
		},
		{
			description: 'Should save only the setting has change from default value',
			before: sinon => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sinon.stub(ClientModel.prototype, 'update').resolves(1);
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
			after: (response, sinon) => {
				sinon.assert.calledOnceWithExactly(ClientModel.prototype.update, {
					'settings.sample-entity': { 'sample-setting': 'not-default' }
				}, { code: 'defaultClient' });
			}
		},
		{
			description: 'Should save only an one setting, because the second is an empty setting',
			before: sinon => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sinon.stub(ClientModel.prototype, 'update').resolves(1);
			},
			request: {
				data: { 
					'sample-setting': '',
					'other-sample-setting': 15
				},
				pathParameters: ['sample-entity']
			},
			session: true,
			response: { code: 200 },
			after: (response, sinon) => {
				sinon.assert.calledOnceWithExactly(ClientModel.prototype.update, {
					'settings.sample-entity': { 'other-sample-setting': 15 }
				}, { code: 'defaultClient' });
			}
		},
		{
			description: 'Should save only the setting is in definition file',
			before: sinon => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sinon.stub(ClientModel.prototype, 'update').resolves(1);
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
			after: (response, sinon) => {
				sinon.assert.calledOnceWithExactly(ClientModel.prototype.update, {
					'settings.sample-entity': { 'sample-setting': 'not-default' }
				}, { code: 'defaultClient' });
			}
		},
		{
			description: 'Should not save the settings when each setting value is the default value',
			before: sinon => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sinon.stub(ClientModel.prototype, 'update');
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
			after: (response, sinon) => {
				sinon.assert.notCalled(ClientModel.prototype.update);
			}
		},
		{
			description:
				'Should not save the settings when each setting are empty, and by default it is not allowed to save empty settings',
			before: sinon => {

				mockRequire(defaultDefinitionPath, settingsDefinitionWithSaveEmptyValueAsFalse);
				mockRequire(clientPath, ClientModel);

				sinon.stub(ClientModel.prototype, 'update');
			},
			request: {
				data: emptySettingsDefinitionRequestData,
				pathParameters: ['sample-entity']
			},
			session: true,
			response: { code: 200 },
			after: (response, sinon) => {
				sinon.assert.notCalled(ClientModel.prototype.update);
			}
		},
		{
			description: 'Should rejects if database fails updating client',
			before: sinon => {

				mockRequire(defaultDefinitionPath, settingsDefinition);
				mockRequire(clientPath, ClientModel);

				sinon.stub(ClientModel.prototype, 'update').rejects();
			},
			request: {
				data: { ...settingsDefinitionRequestData },
				pathParameters: ['sample-entity']
			},
			session: true,
			response: { code: 500 },
			after: (response, sinon) => {
				sinon.assert.calledOnceWithExactly(ClientModel.prototype.update, {
					'settings.sample-entity': { ...settingsDefinitionRequestData }
				}, { code: 'defaultClient' });
			}
		}
	]));
});

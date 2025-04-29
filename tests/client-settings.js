'use strict';

const sinon = require('sinon');
const assert = require('assert');
const mockRequire = require('mock-require');

const { ApiSession } = require('@janiscommerce/api-session');

const {
	ClientSettings,
	ClientSettingsError
} = require('../lib');

const DefinitionFetcher = require('../lib/definition-fetcher');

describe('ClientSettings', () => {

	let uniqueIndex = 1;
	const getUniqueDefinitionPath = () => `/custom/path-${uniqueIndex++}`;

	const defaultDefinitionPath = DefinitionFetcher.getPath();

	const getSession = (settings, clientCode = 'sample-client') => new ApiSession({ clientCode }, { clientCode, ...settings && { settings } });

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

	const entity = 'sample-entity';
	const settingName = 'sample-setting';
	const value = 'sample-value';

	afterEach(() => {
		sinon.restore();
		mockRequire.stopAll();
	});

	context('When cannot get setting', () => {

		it('Should reject if session is not set', async () => {

			const clientSettings = new ClientSettings();

			await assert.rejects(() => clientSettings.get(entity, settingName), {
				name: 'ClientSettingsError',
				code: ClientSettingsError.codes.SESSION_NOT_SET
			});
		});

		it('Should reject if setting definition is not found', async () => {

			const session = getSession();
			const clientSettings = session.getSessionInstance(ClientSettings);

			await assert.rejects(() => clientSettings.get(entity, settingName), {
				name: 'ClientSettingsError',
				code: ClientSettingsError.codes.SETTING_DEFINITION_NOT_FOUND
			});
		});

		it('Should reject if the default definition file is empty', async () => {

			const session = getSession();
			const clientSettings = session.getSessionInstance(ClientSettings);

			mockRequire(defaultDefinitionPath, undefined);

			await assert.rejects(() => clientSettings.get(entity, settingName), {
				name: 'ClientSettingsError',
				code: ClientSettingsError.codes.SETTING_DOES_NOT_EXIST
			});
		});

		it('Should reject if requested setting entity does not exist', async () => {

			const session = getSession();
			const clientSettings = session.getSessionInstance(ClientSettings);

			const uniqueDefinitionPath = getUniqueDefinitionPath();
			mockRequire(uniqueDefinitionPath, settingsDefinition);

			await assert.rejects(() => {
				return clientSettings
					.setSettingsDefinitionPath(uniqueDefinitionPath)
					.get('unknown-entity', settingName);
			}, {
				name: 'ClientSettingsError',
				code: ClientSettingsError.codes.SETTING_DOES_NOT_EXIST
			});
		});

		it('Should reject if requested setting name does not exist', async () => {

			const session = getSession({ [entity]: { other: true } });
			const clientSettings = session.getSessionInstance(ClientSettings);

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			await assert.rejects(() => {
				return clientSettings
					.setSettingsDefinitionPath(uniqueDefinitionPath)
					.get(entity, 'unknown-setting-name');
			}, {
				name: 'ClientSettingsError',
				code: ClientSettingsError.codes.SETTING_DOES_NOT_EXIST
			});
		});
	});

	context('When cannot get setting', () => {

		it('Should use a custom definition path if it is set', async () => {

			const session = getSession();
			const clientSettings = session.getSessionInstance(ClientSettings);

			mockRequire('/custom/path', settingsDefinition);

			const settingValue = await clientSettings
				.setSettingsDefinitionPath('/custom/path')
				.get(entity, settingName);

			assert.deepStrictEqual(settingValue, 'sample-default-value');
		});

		it('Should resolve the setting value if Client has it', async () => {

			const session = getSession({ [entity]: { [settingName]: value } });
			const clientSettings = session.getSessionInstance(ClientSettings);

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			const settingValue = await clientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.get(entity, settingName);

			assert.deepStrictEqual(settingValue, value);
		});

		it('Should resolve the setting value if Client has it and then use it from cache on consecutive calls', async () => {

			const client1Settings = getSession({ [entity]: { [settingName]: value } }).getSessionInstance(ClientSettings);
			const client2Settings = getSession().getSessionInstance(ClientSettings);

			sinon.spy(ClientSettings.prototype, 'getForClient');

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			const settingValue = await client1Settings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.get(entity, settingName);

			assert.deepStrictEqual(settingValue, value);

			const secondSettingValue = await client2Settings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.get(entity, settingName);

			assert.deepStrictEqual(secondSettingValue, value);

			sinon.assert.calledOnce(ClientSettings.prototype.getForClient);
		});

		it('Should resolve the setting value if Client has it and then use it from cache on consecutive calls (with multiple clients)', async () => {

			const client1Settings = getSession({ [entity]: { [settingName]: value } }).getSessionInstance(ClientSettings);
			const client2Settings = getSession({ [entity]: { [settingName]: 'another' } }, 'other-client').getSessionInstance(ClientSettings);

			sinon.spy(ClientSettings.prototype, 'getForClient');

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			const settingValue = await client1Settings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.get(entity, settingName);

			assert.deepStrictEqual(settingValue, value);

			const secondSettingValue = await client1Settings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.get(entity, settingName);

			assert.deepStrictEqual(secondSettingValue, value);

			const secondClientSettingValue = await client2Settings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.get(entity, settingName);

			assert.deepStrictEqual(secondClientSettingValue, 'another');

			sinon.assert.calledTwice(ClientSettings.prototype.getForClient);
		});

		it('Should resolve the setting value from default value if it\'s not found', async () => {

			const clientSettings = getSession().getSessionInstance(ClientSettings);

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			const settingValue = await clientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.get(entity, settingName);

			assert.deepStrictEqual(settingValue, 'sample-default-value');
		});

		it('Should try to fetch the setting value from Client if it\'s found, once for each setting', async () => {

			const clientSettings = getSession({
				[entity]: {
					[settingName]: value,
					'other-sample-setting': 0
				}
			}).getSessionInstance(ClientSettings);

			sinon.spy(ClientSettings.prototype, 'getForClient');

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			clientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setCacheTime(60);

			// Get first setting. This should go to the DB
			const settingValue = await clientSettings
				.get(entity, settingName);

			// Get two more times. This should resolve from cache
			await clientSettings.get(entity, settingName);
			await clientSettings.get(entity, settingName);

			assert.deepStrictEqual(settingValue, value);

			// Now get a different setting. This should go to the DB
			const otherSettingValue = await clientSettings.get(entity, 'other-sample-setting');

			assert.deepStrictEqual(otherSettingValue, 0);

			sinon.assert.calledOnce(ClientSettings.prototype.getForClient);
		});
	});


});

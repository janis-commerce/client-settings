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

			await assert.rejects(() => ClientSettings.get(entity, settingName), {
				name: 'ClientSettingsError',
				code: ClientSettingsError.codes.SESSION_NOT_SET
			});
		});

		it('Should reject if setting definition is not found', async () => {

			await assert.rejects(() => ClientSettings.setSession(getSession()).get(entity, settingName), {
				name: 'ClientSettingsError',
				code: ClientSettingsError.codes.SETTING_DEFINITION_NOT_FOUND
			});
		});

		it('Should reject if the default definition file is empty', async () => {

			mockRequire(defaultDefinitionPath, undefined);

			await assert.rejects(() => ClientSettings.setSession(getSession()).get(entity, settingName), {
				name: 'ClientSettingsError',
				code: ClientSettingsError.codes.SETTING_DOES_NOT_EXIST
			});
		});

		it('Should reject if requested setting entity does not exist', async () => {

			const uniqueDefinitionPath = getUniqueDefinitionPath();
			mockRequire(uniqueDefinitionPath, settingsDefinition);

			await assert.rejects(() => {
				return ClientSettings
					.setSettingsDefinitionPath(uniqueDefinitionPath)
					.setSession(getSession())
					.get('unknown-entity', settingName);
			}, {
				name: 'ClientSettingsError',
				code: ClientSettingsError.codes.SETTING_DOES_NOT_EXIST
			});
		});

		it('Should reject if requested setting name does not exist', async () => {

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			await assert.rejects(() => {
				return ClientSettings
					.setSettingsDefinitionPath(uniqueDefinitionPath)
					.setSession(getSession({ [entity]: { other: true } }))
					.get(entity, 'unknown-setting-name');
			}, {
				name: 'ClientSettingsError',
				code: ClientSettingsError.codes.SETTING_DOES_NOT_EXIST
			});
		});
	});

	context('When cannot get setting', () => {

		it('Should use a custom definition path if it is set', async () => {

			mockRequire('/custom/path', settingsDefinition);

			const settingValue = await ClientSettings
				.setSettingsDefinitionPath('/custom/path')
				.setSession(getSession())
				.get(entity, settingName);

			assert.deepStrictEqual(settingValue, 'sample-default-value');
		});

		it('Should resolve the setting value if Client has it', async () => {

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			const settingValue = await ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(getSession({ [entity]: { [settingName]: value } }))
				.get(entity, settingName);

			assert.deepStrictEqual(settingValue, value);
		});

		it('Should resolve the setting value if Client has it and then use it from cache on consecutive calls', async () => {

			sinon.spy(ClientSettings, 'getForClient');

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			const settingValue = await ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(getSession({ [entity]: { [settingName]: value } }))
				.get(entity, settingName);

			assert.deepStrictEqual(settingValue, value);

			const secondSettingValue = await ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(getSession())
				.get(entity, settingName);

			assert.deepStrictEqual(secondSettingValue, value);

			sinon.assert.calledOnce(ClientSettings.getForClient);
		});

		it('Should resolve the setting value if Client has it and then use it from cache on consecutive calls (with multiple clients)', async () => {

			sinon.spy(ClientSettings, 'getForClient');

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			const settingValue = await ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(getSession({ [entity]: { [settingName]: value } }))
				.get(entity, settingName);

			assert.deepStrictEqual(settingValue, value);

			const secondSettingValue = await ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(getSession())
				.get(entity, settingName);

			assert.deepStrictEqual(secondSettingValue, value);

			const secondClientSettingValue = await ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(getSession({ [entity]: { [settingName]: 'another' } }, 'other-client'))
				.get(entity, settingName);

			assert.deepStrictEqual(secondClientSettingValue, 'another');

			const secondClientSecondSettingValue = await ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(getSession(undefined, 'other-client'))
				.get(entity, settingName);

			assert.deepStrictEqual(secondClientSecondSettingValue, 'another');

			const settingValueFromFirstClient = await ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(getSession())
				.get(entity, settingName);

			assert.deepStrictEqual(settingValueFromFirstClient, value);

			sinon.assert.calledTwice(ClientSettings.getForClient);
		});

		it('Should resolve the setting value from default value if it\'s not found', async () => {

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			const settingValue = await ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(getSession())
				.get(entity, settingName);

			assert.deepStrictEqual(settingValue, 'sample-default-value');
		});

		it('Should try to fetch the setting value from Client if it\'s found, once for each setting', async () => {

			sinon.spy(ClientSettings, 'getForClient');

			const uniqueDefinitionPath = getUniqueDefinitionPath();

			mockRequire(uniqueDefinitionPath, settingsDefinition);

			ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setCacheTime(60)
				.setSession(getSession({
					[entity]: {
						[settingName]: value,
						'other-sample-setting': 0
					}
				}));

			// Get first setting. This should go to the DB
			const settingValue = await ClientSettings
				.get(entity, settingName);

			// Get two more times. This should resolve from cache
			await ClientSettings.get(entity, settingName);
			await ClientSettings.get(entity, settingName);

			assert.deepStrictEqual(settingValue, value);

			// Now get a different setting. This should go to the DB
			const otherSettingValue = await ClientSettings.get(entity, 'other-sample-setting');

			assert.deepStrictEqual(otherSettingValue, 0);

			sinon.assert.calledOnce(ClientSettings.getForClient);
		});
	});


});

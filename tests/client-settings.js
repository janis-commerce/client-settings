'use strict';

const sinon = require('sinon');
const assert = require('assert');
const mockRequire = require('mock-require');

const {
	ClientSettings,
	ClientSettingsError
} = require('../lib');

const ClientSettingsModel = require('../lib/client-settings-model');
const DefinitionFetcher = require('../lib/definition-fetcher');

describe('ClientSettings', () => {

	let uniqueIndex = 1;
	const getUniqueDefinitionPath = () => `/custom/path-${uniqueIndex++}`;

	const defaultDefinitionPath = DefinitionFetcher.getPath();

	const session = {
		clientCode: 'sample-client',
		getSessionInstance: TheClass => {
			const obj = new TheClass();
			obj.session = session;
			return obj;
		}
	};

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

	it('Should reject is no session is set', async () => {
		await assert.rejects(() => ClientSettings.get(entity, settingName), {
			name: 'ClientSettingsError',
			code: ClientSettingsError.codes.SESSION_NOT_SET
		});
	});

	it('Should reject is setting definition is not found', async () => {

		await assert.rejects(() => ClientSettings.setSession(session).get(entity, settingName), {
			name: 'ClientSettingsError',
			code: ClientSettingsError.codes.SETTING_DEFINITION_NOT_FOUND
		});
	});

	it('Should use the default definition path', async () => {

		mockRequire(defaultDefinitionPath, undefined);

		await assert.rejects(() => ClientSettings.setSession(session).get(entity, settingName), {
			name: 'ClientSettingsError',
			code: ClientSettingsError.codes.SETTING_DOES_NOT_EXIST
		});
	});

	it('Should use a custom definition path if it is set', async () => {

		mockRequire('/custom/path', settingsDefinition);

		await assert.rejects(() => ClientSettings
			.setSettingsDefinitionPath('/custom/path')
			.setSession(session)
			.get(entity, settingName)
		);
	});

	it('Should reject if requested setting entity does not exist', async () => {

		const uniqueDefinitionPath = getUniqueDefinitionPath();
		mockRequire(uniqueDefinitionPath, settingsDefinition);

		await assert.rejects(() => {
			return ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(session)
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
				.setSession(session)
				.get(entity, 'unknown-setting-name');
		}, {
			name: 'ClientSettingsError',
			code: ClientSettingsError.codes.SETTING_DOES_NOT_EXIST
		});
	});

	it('Should reject if setting value cannot be fetched', async () => {

		const uniqueDefinitionPath = getUniqueDefinitionPath();

		mockRequire(uniqueDefinitionPath, settingsDefinition);

		const fetchError = new Error('Failed to fetch');

		sinon.stub(ClientSettingsModel.prototype, 'getBy');
		ClientSettingsModel.prototype.getBy.rejects(fetchError);

		await assert.rejects(() => {
			return ClientSettings
				.setSettingsDefinitionPath(uniqueDefinitionPath)
				.setSession(session)
				.get(entity, settingName);
		}, fetchError);
	});

	it('Should resolve the setting value from DB if it\'s found', async () => {

		const uniqueDefinitionPath = getUniqueDefinitionPath();

		mockRequire(uniqueDefinitionPath, settingsDefinition);

		sinon.stub(ClientSettingsModel.prototype, 'getBy');
		ClientSettingsModel.prototype.getBy.resolves({
			entity,
			values: { [settingName]: value }
		});

		const settingValue = await ClientSettings
			.setSettingsDefinitionPath(uniqueDefinitionPath)
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(settingValue, value);

		sinon.assert.calledOnceWithExactly(ClientSettingsModel.prototype.getBy, 'entity', entity, {	unique: true });
	});

	it('Should resolve the setting value from DB if it\'s found and then from cache on consecutive calls', async () => {

		const uniqueDefinitionPath = getUniqueDefinitionPath();

		mockRequire(uniqueDefinitionPath, settingsDefinition);

		sinon.stub(ClientSettingsModel.prototype, 'getBy');
		ClientSettingsModel.prototype.getBy.resolves({
			entity,
			values: { [settingName]: value }
		});

		const settingValue = await ClientSettings
			.setSettingsDefinitionPath(uniqueDefinitionPath)
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(settingValue, value);

		const secondSettingValue = await ClientSettings
			.setSettingsDefinitionPath(uniqueDefinitionPath)
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(secondSettingValue, value);

		sinon.assert.calledOnce(ClientSettingsModel.prototype.getBy);
	});

	it('Should resolve the setting value from default value if it\'s not found', async () => {

		const uniqueDefinitionPath = getUniqueDefinitionPath();

		mockRequire(uniqueDefinitionPath, settingsDefinition);

		sinon.stub(ClientSettingsModel.prototype, 'getBy');
		ClientSettingsModel.prototype.getBy.resolves(null);

		const settingValue = await ClientSettings
			.setSettingsDefinitionPath(uniqueDefinitionPath)
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(settingValue, 'sample-default-value');
	});

	it('Should resolve the setting value from default value if it\'s not found and then from cache on consecutive calls', async () => {

		const uniqueDefinitionPath = getUniqueDefinitionPath();

		mockRequire(uniqueDefinitionPath, settingsDefinition);

		sinon.stub(ClientSettingsModel.prototype, 'getBy');
		ClientSettingsModel.prototype.getBy.resolves(null);

		const settingValue = await ClientSettings
			.setSettingsDefinitionPath(uniqueDefinitionPath)
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(settingValue, 'sample-default-value');

		const secondSettingValue = await ClientSettings
			.setSettingsDefinitionPath(uniqueDefinitionPath)
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(secondSettingValue, 'sample-default-value');

		sinon.assert.calledOnce(ClientSettingsModel.prototype.getBy);
	});

	it('Should try to fetch the setting value from DB if it\'s found, once for each setting', async () => {

		const uniqueDefinitionPath = getUniqueDefinitionPath();

		mockRequire(uniqueDefinitionPath, settingsDefinition);

		sinon.stub(ClientSettingsModel.prototype, 'getBy');
		ClientSettingsModel.prototype.getBy.resolves({
			entity,
			values: { [settingName]: value }
		});

		ClientSettings
			.setSettingsDefinitionPath(uniqueDefinitionPath)
			.setSession(session);

		// Get first setting. This should go to the DB
		const settingValue = await ClientSettings
			.get(entity, settingName);

		// Get two more times. This should resolve from cache
		await ClientSettings.get(entity, settingName);
		await ClientSettings.get(entity, settingName);

		assert.deepStrictEqual(settingValue, value);

		// Now get a different setting. This should go to the DB
		const otherSettingValue = await ClientSettings
			.get(entity, 'other-sample-setting');

		assert.deepStrictEqual(otherSettingValue, 0);

		sinon.assert.calledOnce(ClientSettingsModel.prototype.getBy);
		sinon.assert.calledWithExactly(ClientSettingsModel.prototype.getBy, 'entity', entity, {	unique: true });
	});

});

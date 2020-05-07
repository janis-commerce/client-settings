'use strict';

const assert = require('assert');
const fs = require('fs');

const sinon = require('sinon');

const {
	ClientSettings,
	ClientSettingsError
} = require('../lib');

const ClientSettingsModel = require('../lib/client-settings-model');

describe('ClientSettings', () => {

	let uniqueIndex = 1;
	const getUniqueDefinitionPath = () => `/custom/path-${uniqueIndex++}`;

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
	});

	it('Should reject is no session is set', async () => {
		await assert.rejects(() => ClientSettings.get(entity, settingName), {
			name: 'ClientSettingsError',
			code: ClientSettingsError.codes.SESSION_NOT_SET
		});
	});

	it('Should reject is setting definition is not found', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(new Error('File definition not found'));

		await assert.rejects(() => ClientSettings.setSession(session).get(entity, settingName), {
			name: 'ClientSettingsError',
			code: ClientSettingsError.codes.SETTING_DEFINITION_NOT_FOUND
		});
	});

	it('Should use the default definition path', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(new Error('File definition not found'));

		await assert.rejects(() => ClientSettings
			.setSession(session)
			.get(entity, settingName)
		);

		const cwd = process.cwd();

		sinon.assert.calledOnceWithExactly(readFileStub, `${cwd}/schemas/settings`, sinon.match.func);
	});

	it('Should use a custom definition path if it is set', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(new Error('File definition not found'));

		await assert.rejects(() => ClientSettings
			.setSettingsDefinitionPath('/custom/path')
			.setSession(session)
			.get(entity, settingName)
		);

		sinon.assert.calledOnceWithExactly(readFileStub, '/custom/path', sinon.match.func);
	});

	it('Should reject if requested setting entity does not exist', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(null, settingsDefinition);

		await assert.rejects(() => {
			return ClientSettings
				.setSettingsDefinitionPath(getUniqueDefinitionPath())
				.setSession(session)
				.get('unknown-entity', settingName);
		}, {
			name: 'ClientSettingsError',
			code: ClientSettingsError.codes.SETTING_DOES_NOT_EXIST
		});
	});

	it('Should reject if requested setting name does not exist', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(null, settingsDefinition);

		await assert.rejects(() => {
			return ClientSettings
				.setSettingsDefinitionPath(getUniqueDefinitionPath())
				.setSession(session)
				.get(entity, 'unknown-setting-name');
		}, {
			name: 'ClientSettingsError',
			code: ClientSettingsError.codes.SETTING_DOES_NOT_EXIST
		});
	});

	it('Should reject if setting value cannot be fetched', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(null, settingsDefinition);

		const fetchError = new Error('Failed to fetch');

		sinon.stub(ClientSettingsModel.prototype, 'get');
		ClientSettingsModel.prototype.get.rejects(fetchError);

		await assert.rejects(() => {
			return ClientSettings
				.setSettingsDefinitionPath(getUniqueDefinitionPath())
				.setSession(session)
				.get(entity, settingName);
		}, fetchError);
	});

	it('Should resolve the setting value from DB if it\'s found', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(null, settingsDefinition);

		sinon.stub(ClientSettingsModel.prototype, 'get');
		ClientSettingsModel.prototype.get.resolves({
			entity,
			name: settingName,
			value
		});

		const settingValue = await ClientSettings
			.setSettingsDefinitionPath(getUniqueDefinitionPath())
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(settingValue, value);

		sinon.assert.calledOnceWithExactly(ClientSettingsModel.prototype.get, {
			filters: {
				entity,
				name: settingName
			},
			limit: 1,
			unique: true
		});
	});

	it('Should resolve the setting value from DB if it\'s found and then from cache on consecutive calls', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(null, settingsDefinition);

		sinon.stub(ClientSettingsModel.prototype, 'get');
		ClientSettingsModel.prototype.get.resolves({
			entity,
			name: settingName,
			value
		});

		const pathDefinition = getUniqueDefinitionPath();

		const settingValue = await ClientSettings
			.setSettingsDefinitionPath(pathDefinition)
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(settingValue, value);

		const secondSettingValue = await ClientSettings
			.setSettingsDefinitionPath(pathDefinition)
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(secondSettingValue, value);

		sinon.assert.calledOnce(ClientSettingsModel.prototype.get);
	});

	it('Should resolve the setting value from default value if it\'s not found', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(null, settingsDefinition);

		sinon.stub(ClientSettingsModel.prototype, 'get');
		ClientSettingsModel.prototype.get.resolves(null);

		const settingValue = await ClientSettings
			.setSettingsDefinitionPath(getUniqueDefinitionPath())
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(settingValue, 'sample-default-value');
	});

	it('Should resolve the setting value from default value if it\'s not found and then from cache on consecutive calls', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(null, settingsDefinition);

		sinon.stub(ClientSettingsModel.prototype, 'get');
		ClientSettingsModel.prototype.get.resolves(null);

		const pathDefinition = getUniqueDefinitionPath();

		const settingValue = await ClientSettings
			.setSettingsDefinitionPath(pathDefinition)
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(settingValue, 'sample-default-value');

		const secondSettingValue = await ClientSettings
			.setSettingsDefinitionPath(pathDefinition)
			.setSession(session)
			.get(entity, settingName);

		assert.deepStrictEqual(secondSettingValue, 'sample-default-value');

		sinon.assert.calledOnce(ClientSettingsModel.prototype.get);
	});

	it('Should try to fetch the setting value from DB if it\'s found, once for each setting', async () => {

		const readFileStub = sinon.stub(fs, 'readFile');
		readFileStub.yields(null, settingsDefinition);

		sinon.stub(ClientSettingsModel.prototype, 'get');
		ClientSettingsModel.prototype.get.onCall(0).resolves({
			entity,
			name: settingName,
			value
		});
		ClientSettingsModel.prototype.get.onCall(1).resolves(null);

		ClientSettings
			.setSettingsDefinitionPath(getUniqueDefinitionPath())
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

		sinon.assert.calledTwice(ClientSettingsModel.prototype.get);
		sinon.assert.calledWithExactly(ClientSettingsModel.prototype.get.getCall(0), {
			filters: {
				entity,
				name: settingName
			},
			limit: 1,
			unique: true
		});
		sinon.assert.calledWithExactly(ClientSettingsModel.prototype.get.getCall(1), {
			filters: {
				entity,
				name: 'other-sample-setting'
			},
			limit: 1,
			unique: true
		});
	});

});

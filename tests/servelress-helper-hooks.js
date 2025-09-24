'use strict';

const assert = require('assert');
const cloneDeep = require('lodash.clonedeep');

const { ServerlessHelperHooks } = require('../lib/index');

describe('Servelress Helper Hooks', () => {

	const defaultConfig = [
		[
			'janis.api',
			{
				path: 'setting/{entity}',
				method: 'get',
				authorizer: 'FullAuthorizer',
				cors: true,
				package: {
					include: [
						'schemas/settings/index.js'
					]
				}
			}
		],
		[
			'janis.api',
			{
				path: 'setting/{entity}',
				method: 'put',
				authorizer: 'FullAuthorizer',
				cors: true,
				package: {
					include: [
						'schemas/settings/index.js'
					]
				}
			}
		]
	];

	it('Return the basic configuration if no arguments are passed', () => {
		assert.deepStrictEqual(ServerlessHelperHooks(), defaultConfig);
	});

	it('Return the basic configuration if and empty object is passed', () => {
		assert.deepStrictEqual(ServerlessHelperHooks({}), defaultConfig);
	});

	it('Return the basic configuration if and empty includes array is passed', () => {
		assert.deepStrictEqual(ServerlessHelperHooks({ includes: [] }), defaultConfig);
	});

	it('Return add custom includes to the basic configuration if they are passed', () => {

		const customConfig = cloneDeep(defaultConfig);
		customConfig[0][1].package.include.push('foo');
		customConfig[0][1].package.include.push('bar');
		customConfig[1][1].package.include.push('foo');
		customConfig[1][1].package.include.push('bar');

		assert.deepStrictEqual(ServerlessHelperHooks({ includes: ['foo', 'bar'] }), customConfig);
	});

	it('Return add custom env variables to the basic configuration if they are passed', () => {

		const customConfig = cloneDeep(defaultConfig);
		customConfig[1][1].functionRawProps = {
			environment: {
				SETTINGS_UPDATED_SNS_TOPIC_ARN: 'arn:aws:sns:us-east-1:000000000000:settingsUpdated'
			}
		};

		assert.deepStrictEqual(ServerlessHelperHooks({
			apiPutEnvVariables: {
				SETTINGS_UPDATED_SNS_TOPIC_ARN: 'arn:aws:sns:us-east-1:000000000000:settingsUpdated'
			}
		}), customConfig);
	});

});

'use strict';

module.exports = ({ includes = [], functionRawProps = {} } = {}) => [
	[
		'janis.api',
		{
			path: 'setting/{entity}',
			method: 'get',
			authorizer: 'FullAuthorizer',
			cors: true,
			package: {
				include: [
					'schemas/settings/index.js',
					...includes
				]
			},
			...functionRawProps.getApi && {
				functionRawProps: {
					...functionRawProps.putApi
				}
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
					'schemas/settings/index.js',
					...includes
				]
			},
			...functionRawProps.putApi && {
				functionRawProps: {
					...functionRawProps.putApi
				}
			}
		}
	]
];

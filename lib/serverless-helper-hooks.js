'use strict';

module.exports = ({ includes = [] } = {}) => [
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
			}
		}
	]
];

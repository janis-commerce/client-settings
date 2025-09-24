'use strict';

const PutSettingApi = require('../../lib/put-setting-api');

module.exports = class PutApiWithEventAndFormatter extends PutSettingApi {

	getTopicArn() {
		return 'arn:aws:sns:us-east-1:000000000000:sample-topic';
	}

	formatEventData(newSettings) {
		return {
			content: {
				custom: true
			},
			...newSettings['sample-setting'] === 'set-attribute' && {
				attributes: {
					customAttibute: 'ok'
				}
			}
		};
	}

};

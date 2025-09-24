'use strict';

const PutSettingApi = require('../../lib/put-setting-api');

module.exports = class PutApiWithEvent extends PutSettingApi {

	getTopicArn() {
		return 'arn:aws:sns:us-east-1:000000000000:sample-topic';
	}

};

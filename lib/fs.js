'use strict';

const fs = require('fs');

// util.promisify doesn't allow to assert calls to the function, so I made my own
module.exports.readFile = filePath => new Promise((resolve, reject) => {
	fs.readFile(filePath, (err, file) => {
		if(err)
			return reject(err);

		resolve(file);
	});
});

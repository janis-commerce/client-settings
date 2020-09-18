# client-settings

![Build Status](https://github.com/janis-commerce/client-settings/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/client-settings/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/client-settings?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fclient-settings.svg)](https://www.npmjs.com/package/@janiscommerce/client-settings)

A package to handle client settings. This package allows you to declare all the settings available for each entity of your service.

It also provides you with a class to easily get the settings value per client, with a fallback in the default values you have previously defined. You have many other tools to help you, like two APIs to get and update the settings, sample schemas for them, hooks for [sls-helper](https://www.npmjs.com/package/sls-helper) and [sls-helper-plugin-janis](https://www.npmjs.com/package/sls-helper-plugin-janis), unique indexes definitions for [Mongodb Index Creator](https://www.npmjs.com/package/@janiscommerce/mongodb-index-creator), etc.

## Installation
```sh
npm install @janiscommerce/client-settings
```

## Usage

### Settings definition

Settings must be previously defined in a "definition file". The default definition file location is `project-path/schemas/settings/index.js`.
If you want to get it from somewhere else, you can call `ClientSettings.setSettingsDefinitionPath()` (remember to use an absolut path).

The definition file is just a JS file that exports the following structure (with as many settings as needed):

```js
module.exports = {
	[entity]: {
		[settingName]: {
			description: 'A description of what this setting does',
			struct: 'The validation to use with @janiscommerce/superstruct package',
			default: settingDefaultValue // Of any type
		}
	}
}
```

For example:

```js
const { struct } = require('@janiscommerce/superstruct');

module.exports = {
	product: {
		defaultStatus: {
			description: 'The status to be set to a product if any status is provided',
			struct: struct.enum(['active', 'inactive']),
			default: 'active'
		},
	},
	sku: {
		defaultUnitMultiplier: {
			description: 'The unit multiplier to be set to an SKU if any multiplier is provided',
			struct: 'number & positive',
			default: 1
		}
	}
}
```

### Settings fetch

To fetch the clients settings, you must use the `ClientSettings` class. You **must** always set a [session](https://npmjs.org/package/@janiscommerce/api-session) before fetching any setting.

```js
const { ClientSettings } = require('@janiscommerce/client-settings');

// mySession must be an instance of @janiscommerce/api-session
ClientSettings.setSession(mySession);

const productDefaultStatus = ClientSettings.get('product', 'defaultStatus');

console.log(productDefaultStatus); // For example, 'active'
```

### Settings management

To allow the user to change the client settings values, you have to implement a few things:

- The Mongodb indexes

```js
// schemas/mongo/clients.js
const { ClientIndexes } = require('@janiscommerce/client-settings');

module.exports = {

	// Your other indexes

	...ClientIndexes
};
```

- The Serverless helpers hooks

```js
// serverless.js
const { helper } = require('sls-helper');

const { ServerlessHelperHooks } = require('@janiscommerce/client-settings');

module.exports = helper({
	hooks: [
		// other hooks

		...ServerlessHelperHooks()

		// You can pass an object that acceps an array of manual includes for you APIs.
		// For example:
		// ...ServerlessHelperHooks({
		// 	includes: [
		// 		'some/file/path'
		// 	]
		// })

	]
});
```

- A GET API to fetch the current configuration.

```js
// src/api/setting/get.js
const { GetSettingApi } = require('@janiscommerce/client-settings');

module.exports = GetSettingApi;
```

- A PUT API to update the current configuration.

```js
// src/api/setting/put.js
const { PutSettingApi } = require('@janiscommerce/client-settings');

module.exports = PutSettingApi;
```

- The schemas for both APIs:

The GET Schema: [`get.yml`](docs/schemas/setting/get.yml)

The PUT Schema: [`put.yml`](docs/schemas/setting/put.yml)

- An Edit view schema:

Here's an example that you must customize with your own settings: [`edit.yml`](docs/view-schemas/setting/edit.yml)

### Important!

- Remember you replace `your-service` for your actual service name in both API Schemas and in the view schema.
- Remember to add the `Settings` tag to your API schema.
- And remember to add the permissions to you [permissions definition](docs/permissions/src/setting.yml)!

## ClientSettings API

`const { ClientSettings } = require('@janiscommerce/client-settings');`

To fetch client settings or their default values.

#### **setSession(session)**

- `session` An instance of [API Session](https://npmjs.org/package/@janiscommerce/api-session)

Chainable. Returns the `this` object.

#### **setSettingsDefinitionPath(path)**

- `path` <String> The absolute path to the definitions file

Chainable. Returns the `this` object.

#### **async get(entity, settingName)**

- `entity` <String> The name of the entity that owns the setting
- `settingName` <String> The name of the setting to fetch

Resolves the setting value (of any type).

Rejects a `ClientSettingsError` if one of the following errors occur:
- The definition file can't be found
- The setting is not present in the definition file
- DB connection fails when fetching the value

If a setting value is not present in the `settings` DB table/collection, it will return the default value, defined in the definition file.
Alsoo, the class automatically caches the values of each setting once they are required.

# client-settings

[![Build Status](https://travis-ci.org/janis-commerce/client-settings.svg?branch=master)](https://travis-ci.org/janis-commerce/client-settings)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/client-settings/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/client-settings?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fclient-settings.svg)](https://www.npmjs.com/package/@janiscommerce/client-settings)

A package to handle client settings

## Installation
```sh
npm install @janiscommerce/client-settings
```

## API

This package exports the following modules:

### ClientSettings

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

### ClientSettingsError

The Error class that is rejected when getting a setting value.

### ClientIndexes

The indexes of the `settings` table/collection, to be used along with [Mongodb Index Creator](https://www.npmjs.com/package/@janiscommerce/mongodb-index-creator) package, as per-client indexes.

### ServerlessHelperHooks

A function that returns the hooks to use with [sls-helper](https://www.npmjs.com/package/sls-helper) and [sls-helper-plugin-janis](https://www.npmjs.com/package/sls-helper-plugin-janis).

It receives an object as argument with the following optional properties:

- `includes` To add som custom include in the `UpdateSettingsApi`

## Usage

To fetch the clients settings, you must use the `ClientSettings` class. You **must** always set a [session](https://npmjs.org/package/@janiscommerce/api-session) before fetching any setting.

```js
const { ClientSettings } = require('@janiscommerce/client-settings');

// mySession must be an instance of @janiscommerce/api-session
ClientSettings.setSession(mySession);

const productDefaultStatus = ClientSettings.get('product', 'defaultStatus');

console.log(productDefaultStatus); // For example, 'active'
```

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

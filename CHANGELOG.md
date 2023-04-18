# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0] - 2023-04-18
### Changed
- Update [@janiscommerce/api](https://www.npmjs.com/package/@janiscommerce/api) to version 7.0.0

## [3.1.1] - 2022-03-11
### Fixed
- Save settings in cache using `clientCode` as key to avoid conflicts with between different clients

## [3.1.0] - 2022-03-10
### Added
- New Property `saveEmptyValue` to avoid saving empty values `null - '' - 0 - {} - []`

## [3.0.3] - 2021-11-18
### Fixed
- Settings get API doesn't have cache any more

## [3.0.2] - 2021-11-18
### Fixed
- Dependencies updated and pruned

## [3.0.1] - 2021-07-23
### Fixed
- Update API when all values are set to the default value

### Added
- TS typings

## [3.0.0] - 2021-03-25
### Added
- Added Client-Settings method to set custom Cache TTL Time

### Changed
- Now Client-Settings APIs and Client-Settings class uses Service Client's Model  (**BREAKING CHANGE**)
- Now Cache has TTL for getting settings in Client-Settings class

### Removed
- Client-Settings model and indexes

## [2.0.0] - 2020-09-18
### Changed
- Updated `@janiscommerce/api` to `6.x.x`
- Updated `@janiscommerce/model` to `5.x.x`

## [1.0.2] - 2020-06-12
### Fixed
- Fix DB get by entity
- Cache improved to be handled by entity

## [1.0.1] - 2020-05-28
### Fixed
- API Get fixed for non-existent settings in the DB

## [1.0.0] - 2020-05-27
### Added
- First package version
- APIs GET and PUT
- `sls-helper` hooks
- Mongodb indexes
- `ClientSettings` handler to use settings
- Sample API and view schemas

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- Client-Settings APIs and Client-Settings class uses Service Client's Model

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

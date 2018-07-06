# Changelog
All notable changes to this project will be documented in this file.

This changelog started 2017-12-31 with version 1.1.0. Changes before this date are visible in the git log.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

Fill in changes for the next release, here.

## [1.1.5] - 2018-07-06
### Fixed
- `Trait.create(null, trait)` would fail if a `Trait.required` property was not present and the prototype is `null`.

## [1.1.4] - 2018-04-23
### Fixed
- Use `"module"` in _package.json_ to enable ES2015-aware tools like _Rollup_ to take advantage of ES2015 module features.

## [1.1.3] - 2018-01-01
### Fixed
- Use `prepublish` instead of `postinstall` npm hook, since `postinstall` can only use direct dependencies and we need to use _Rollup_ to create
our UMD versions of traits.js.

## [1.1.2] - 2018-01-01
### Fixed
- Remove mkdir for dist folder since npm apparently wants to do that for us and re-creating a folder will throw an error.

## [1.1.1] - 2018-01-01
### Fixed
- Remove mkdirp as the module is not available on post-install and hence not working to create the dist folder - using normal mkdir instead.

## [1.1.0] - 2017-12-31
### Added
- Npm post-install hook now creates a _dist/_ directory with _traits.js_ and
_traits.min.js_. This allow for using the minified version through <https://unpkg.com>.
- Added [changelog](CHANGELOG.md).
- Mention unpkg.com include option and fixed some formatting errors in markdown files.

### Changed
- Npm main file no longer points to _src/traits.js_ but to _dist/traits.js_. Since this is the
unminified version, your module bundler can optimize the minification process according to your project.
- Updated dev dependencies. - qunit can not be updated to any version higher than 2.4.1 due to [karma-qunit](https://github.com/karma-runner/karma-qunit/issues/98).

### Removed
- Nodejs and Commonjs detection in _traits.js_.

[1.1.5]:https://github.com/traitsjs/traits.js/releases/tag/v1.1.5
[1.1.4]:https://github.com/traitsjs/traits.js/releases/tag/v1.1.4
[1.1.3]:https://github.com/traitsjs/traits.js/releases/tag/v1.1.3
[1.1.2]:https://github.com/traitsjs/traits.js/releases/tag/v1.1.2
[1.1.1]:https://github.com/traitsjs/traits.js/releases/tag/v1.1.1
[1.1.0]:https://github.com/traitsjs/traits.js/releases/tag/v1.1.0

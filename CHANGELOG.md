# Changelog
All notable changes to this project will be documented in this file.

This changelog started 2017-12-31 with version 1.1.0. Changes before this date are visible in the git log.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

Fill in changes for the next release, here.

## [1.1.3] - 2018-01-01
### Changed
- Use prepublish instead of postinstall npm hook, since postinstall can only use direct dependencies and we need to use rollup to create
our UMD versions of traits.js.

## [1.1.2] - 2018-01-01
### Changed
- Remove mkdir for dist folder since npm apparently wants to do that for us and re-creating a folder will throw an error.

## [1.1.1] - 2018-01-01
### Changed
- Remove mkdirp as the module is not available on post-install and hence not working to create the dist folder - using normal mkdir instead.

## [1.1.0] - 2017-12-31
### Added
- Npm post-install hook now creates a `dist/` directory with `traits.js` and
`traits.min.js`. This allow for using the minified version through <https://unpkg.com>.
- Added [changelog](CHANGELOG.md).
- Mention unpkg.com include option and fixed some formatting errors in markdown files.

### Changed
- Npm main file no longer points to `src/traits.js` but to `dist/traits.js`. Since this is the
unminified version, your module bundler can optimize the minification process according to your project.
- Updated dev dependencies. - qunit can not be updated to any version higher than 2.4.1 due to [karma-qunit](https://github.com/karma-runner/karma-qunit/issues/98).

### Removed
- Nodejs and Commonjs detection in `traits.js`.

[1.1.3]:https://github.com/traitsjs/traits.js/releases/tag/v1.1.3
[1.1.2]:https://github.com/traitsjs/traits.js/releases/tag/v1.1.2
[1.1.1]:https://github.com/traitsjs/traits.js/releases/tag/v1.1.1
[1.1.0]:https://github.com/traitsjs/traits.js/releases/tag/v1.1.0

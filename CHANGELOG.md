# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Changed

## [1.0.9] - 2019-09-23

- Fix bug discovering docs with various supported workspace configurations
- Remove dependency on `toml`

## [1.0.8] - 2019-09-15

- Fix bug discovering docs with package that uses hyphens `-`, since rust replaces with them with an underscore `_`

## [1.0.7] - 2019-09-13

- Fix bug improperly discovering docs in a Rust workspace (Not VS Code workspace)

## [1.0.6] - 2019-05-07

- List rust folders with rust standard structure
- Open multiple Rust docs per VS Code workspace (i.e. a VS Code workspace with multiple Rust projects)

## [1.0.5] - 2019-05-03

- `vscode` dependencies contained a vunterability. Updated package to latest with no gulp dependency
- `js-yaml` contained vulnerabilities. Updated via `npm audit fix`

## Bugfix

- Add ability to handle untitled workspaces

## [1.0.4] - 2019-02-04

- Add icon and update banner

## [1.0.3] - 2019-02-03

- Remove configuration until it can be used and is fully functional
- Fix nested navigation path resolution

## [1.0.2] - 2019-02-01

- Update README with more setup information

## [1.0.1] - 2019-02-01

- Convert '-' to '_' in projects following rust convention for output docs

## [1.0.0] - 2019-02-01

- Basic display of rust docs allowing navigation within VS Code

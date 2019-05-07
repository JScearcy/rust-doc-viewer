# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- List rust folders with rust standard structure
- Open multiple Rust docs per workspace (i.e. a workspace with multiple Rust projects)

## [1.0.5] - 2019-05-03
## Updated
- `vscode` dependencies contained a vunterability. Updated package to latest with no gulp dependency
- `js-yaml` contained vulnerabilities. Updated via `npm audit fix`
## Bugfix
- Add ability to handle untitled workspaces

## [1.0.4] - 2019-02-04
### Added
- Add icon and update banner

## [1.0.3] - 2019-02-03
### Added
- Remove configuration until it can be used and is fully functional
- Fix nested navigation path resolution

## [1.0.2] - 2019-02-01
### Added
- Update README with more setup information

## [1.0.1] - 2019-02-01
### Added
- Convert '-' to '_' in projects following rust convention for output docs

## [1.0.0] - 2019-02-01
### Added
- Basic display of rust docs allowing navigation within VS Code
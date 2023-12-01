# rust-doc-viewer

This extension will take your locally generated project docs and display them in a new window for easier reference.

Version 4.0.0 may break any documentation generated using older cargo-doc implementations - tested on 1.72.0 toolchain

## Use

* Create the documentation using `cargo doc` inside of your project folder
* Open the folder in VS Code
* Open the Command Palette `Ctrl+Shift+P` or `Cmd+Shift+P`
* Search and activate `Rust: Doc Viewer`

## Features

Open your rust docs and view them in another tab in VS Code

![Rust Doc Viewer Demo](images/rust-doc-viewer-demo.gif)

### Additional configuration

- `rustDocViewer.extraEnv`
  - Set additional evironment variables that will be set before invoking `cargo` commands (used to get project docs location)
  - Will merge with existing set of environment variables, overwriting overlapping variables
  - A single object of key value pair(s)

## Known Issues

    1.) No easy navigation

    2.) Requires documentation to be in the standard output from `cargo docs` 

    3.) Testing and build automation

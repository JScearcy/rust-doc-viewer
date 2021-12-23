const window = {
  createWebviewPanel: jest.fn(),
  showErrorMessage: jest.fn(),
  showQuickPick: jest.fn(),
};

const workspace = {
  workspaceFolders: [],
};

const Uri = {
  file: (f) => f,
  parse: jest.fn(),
};

const commands = {
  registerCommand: jest.fn(),
};

const vscode = {
  window,
  workspace,
  Uri,
  commands,
};

module.exports = vscode;

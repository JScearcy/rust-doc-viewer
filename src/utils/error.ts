import * as vscode from 'vscode';

export const showError = (err: string) => {
  vscode.window.showErrorMessage(`Rust: Docs Viewer: ${err}`);
};

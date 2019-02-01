import * as vscode from 'vscode';
import { RustDocViewer } from './rustDocViewer';

export function activate(context: vscode.ExtensionContext) {
	let rustDocViewer: RustDocViewer | undefined = undefined;
	console.log('"rust-doc-viewer" is now active!');
	let disposable = vscode.commands.registerCommand('extension.rustDocViewer', () => {
		if (rustDocViewer) {
			rustDocViewer.pullToFront();
		} else {
			if (vscode.workspace.name) {
				rustDocViewer = new RustDocViewer(context, () => rustDocViewer = undefined);
				rustDocViewer.init();
			} else {
				vscode.window.showErrorMessage('Rust: Docs Viewer: requires a folder to be open, and docs to be generated.');
			}
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

import * as vscode from 'vscode';
import { RustDocViewer } from './rustDocViewer';

export function activate(context: vscode.ExtensionContext) {
	let rustDocViewer: RustDocViewer | undefined = undefined;
	console.log('"rust-doc-viewer" is now active');
	let disposable = vscode.commands.registerCommand('extension.rustDocViewer', () => {
		if (rustDocViewer) {
			rustDocViewer.pullToFront();
		} else {
			rustDocViewer = new RustDocViewer(context, () => rustDocViewer = undefined);
			rustDocViewer.init();
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

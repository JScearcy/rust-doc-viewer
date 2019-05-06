import * as vscode from 'vscode';
import { RustDocViewer } from './rustDocViewer';
import { Configuration } from './configuration';

export function activate(context: vscode.ExtensionContext) {
	let rustDocViewer: RustDocViewer | undefined = undefined;
	console.log('"rust-doc-viewer" is now active');
	let disposable = vscode.commands.registerCommand('extension.rustDocViewer', async () => {
		if (rustDocViewer) {
			rustDocViewer.pullToFront();
		} else {
			await Configuration.createConfiguration()
				.then(config => {
					rustDocViewer = new RustDocViewer(config, context, () => rustDocViewer = undefined);
					rustDocViewer.init();
				})
				.catch(err => {
					vscode.window.showErrorMessage(`Rust: Docs Viewer: ${err}`);
				});
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

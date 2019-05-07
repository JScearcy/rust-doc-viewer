import * as vscode from 'vscode';
import { RustDocViewer } from './rustDocViewer';
import { Configuration } from './configuration';

export function activate(context: vscode.ExtensionContext) {
	let rustDocViewers: Map<string, RustDocViewer> = new Map();
	console.log('"rust-doc-viewer" is now active');
	let disposable = vscode.commands.registerCommand('extension.rustDocViewer', async () => {
		await Configuration.createConfiguration()
			.then(config => {
				const existingRustDocViewer = rustDocViewers.get(config.getWorkspaceName());
				if (existingRustDocViewer) {
					existingRustDocViewer.pullToFront();
				} else {
					const newRustDocViewer: RustDocViewer = new RustDocViewer(config, context, () => rustDocViewers.delete(config.getWorkspaceName()));
					newRustDocViewer.init();
					rustDocViewers.set(config.getWorkspaceName(), newRustDocViewer);
				}
			})
			.catch(err => {
				vscode.window.showErrorMessage(`Rust: Docs Viewer: ${err}`);
			});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

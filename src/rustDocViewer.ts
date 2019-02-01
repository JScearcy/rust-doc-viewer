import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PostMessageHandler } from './postMessageService';
import { Utilities } from './utilities';
import { Message } from './models';

export class RustDocViewer {
    private currentPanel: vscode.WebviewPanel;
    private postMessageHandler: PostMessageHandler;
    private rustDocSrc: vscode.Uri;

    constructor(private context: vscode.ExtensionContext, disposeFn: () => void) {
        if (vscode.workspace.name) {
            this.currentPanel = vscode.window.createWebviewPanel(
                'rustDocViewer',
                `${vscode.workspace.name} Docs`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );
            const onDiskPath = vscode.Uri.file(
                path.join(vscode.workspace.rootPath || '', 'target', 'doc', vscode.workspace.name, 'index.html')
            );

            this.rustDocSrc = onDiskPath.with({ scheme: 'vscode-resource' });
            this.postMessageHandler = new PostMessageHandler(this.rustDocSrc);
            this.onDispose(disposeFn);
        } else {
            this.showError('No workspace defined to display docs from, please open a folder');
            throw Error('No workspace defined to display docs from, please open a folder');
        }
    }

    init() {
        this.render(this.rustDocSrc);
        this.currentPanel.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
    }

    handleMessage(message: Message) {
        const response = this.postMessageHandler.handleMessage(message);
        if (response && response.el) {
            this.currentPanel.webview.postMessage(response);
        } else if (response && response.page) {
            this.render(response.page);
        } else {
            this.showError('Could not parse message from the docs page');
        }
    }

    render(src: vscode.Uri) {
        this.getCurrentView(src, this.context.extensionPath)
            .then((pageData) => this.currentPanel.webview.html = pageData)
            .catch(err => this.showError('Could not open the Rust Docs - Please check your path configuration'));
    }

    pullToFront() {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        this.currentPanel.reveal(columnToShowIn);
    }

    onDispose(disposeFn: () => void) {
        this.currentPanel.onDidDispose(
            disposeFn,
            null,
            this.context.subscriptions
        );
    }

    private getCurrentView(src: vscode.Uri, extensionPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(src.fsPath, (err, data) => {
                if (err) { reject(err); }
                const dataString = data.toString('utf8');
                const updatedHrefData = Utilities.hrefReplacer(dataString, src);
                let updatedSrcData = Utilities.srcReplacer(updatedHrefData, src);

                const localScriptPath = path.join(extensionPath, 'out', 'vscodeSanitizer.js');
                const localScriptUri = vscode.Uri.file(localScriptPath).with({ scheme: 'vscode-resource' }).toString();
                const removePushStateSpot = updatedSrcData
                    .split('<body>');
                const removePushStateStr = [
                    removePushStateSpot[0],
                    `<body><script>window.history.pushState=null</script>`,
                    removePushStateSpot[1],
                ].join('');
                const rustScriptSpot = removePushStateStr
                    .split('</body>');
                updatedSrcData = [
                    rustScriptSpot[0],
                    `<script src="${localScriptUri}"></script></body>`,
                    rustScriptSpot[1]
                ].join('');
                resolve(updatedSrcData);
            });
        });
    }

    private showError(message: string) {
        vscode.window.showErrorMessage(`Rust: Docs Viewer: ${message}`);
    }
}
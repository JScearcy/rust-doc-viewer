import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PostMessageHandler } from './postMessageService';
import { Utilities } from './utilities';
import { Message } from './models';
import { Configuration } from './configuration';
import { Option } from './option';

export class RustDocViewer {
    private currentPanel: vscode.WebviewPanel;
    private postMessageHandler: Option<PostMessageHandler>;
    private rustDocSrc: Option<vscode.Uri>;

    constructor(private config: Configuration, private context: vscode.ExtensionContext, disposeFn: () => void) {
        this.postMessageHandler = Option.lift<PostMessageHandler>();
        this.rustDocSrc = Option.lift<vscode.Uri>();
        this.currentPanel = vscode.window.createWebviewPanel(
            'rustDocViewer',
            `${this.config.getWorkspaceName()} Docs`,
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );
        this.rustDocSrc = this.config.getUriToDocs();
        this.rustDocSrc.map((uri) => {
            this.postMessageHandler = Option.lift(new PostMessageHandler(uri, context.workspaceState));
            return uri;
        });
        this.onDispose(disposeFn);

    }

    init() {
        if (Option.isValue(this.rustDocSrc)) {
            const uri = this.rustDocSrc.unwrap();
            this.render(uri);
            this.currentPanel.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
        } else {
            this.showError('No workspace defined to display docs from, please open a folder in the workspace');
        }
    }

    handleMessage(message: Message) {
        if (Option.isValue(this.postMessageHandler)) {
            const postMessageHandler = this.postMessageHandler.unwrap();
            const response = postMessageHandler.handleMessage(message);
            if (response && (response.el || response.state)) {
                this.currentPanel.webview.postMessage(response);
            } else if (response && response.page) {
                this.render(response.page);
            } else {
                this.showError('Could not parse message from the docs page');
            }
        } else {
            this.showError('No workspace defined to display docs from, please open a folder in the workspace');
        }
    }

    render(src: vscode.Uri) {
        this.getCurrentView(src, this.context.extensionPath)
            .then((pageData) => this.currentPanel.webview.html = pageData)
            .catch(_ => this.showError(`Could not open the Rust Docs from: ${src.fsPath}`));
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
                const updatedSrcData = Utilities.srcReplacer(updatedHrefData, src);

                const localScriptUri = vscode.Uri.file(path.join(extensionPath, 'out', 'vscodeSanitizer.js'))
                    .with({ scheme: 'vscode-resource' }).toString();
                const [removePushStateSpotBefore, removePushStateSpotAfter ] = updatedSrcData
                    .split('<body>');
                const noPushStateStr = [
                        removePushStateSpotBefore,
                        `<body><script>window.history.pushState=null</script>`,
                        removePushStateSpotAfter
                    ].join('');
                const  [rustScriptSpotBefore, rustScriptSpotAfter] = noPushStateStr
                    .split('</body>');
                const formattedDocument = [
                    rustScriptSpotBefore,
                    `<script src="${localScriptUri}"></script></body>`,
                    rustScriptSpotAfter
                ].join('');

                resolve(formattedDocument);
            });
        });
    }

    private showError(message: string) {
        vscode.window.showErrorMessage(`Rust: Docs Viewer: ${message}`);
    }
}
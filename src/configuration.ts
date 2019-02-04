import * as vscode from 'vscode';
import * as path from 'path';
import { Option } from './option';
import { existsSync } from 'fs';

export class Configuration {
    private fsPathToDocs: string;
    private workspaceName: string;

    constructor() {
        // TODO: Add config path, requires much more work as the view can't retrieve the files directly - must be embedded
        // const configuration = vscode.workspace.getConfiguration('rustDocViewer');
        // const configPath: string | undefined = configuration.get('path');
        this.workspaceName = vscode.workspace.name || 'Rust';
        this.fsPathToDocs = '';

        // if (configPath) {
        //     this.fsPathToDocs = path.join(configPath, 'index.html');
        // }

        if (vscode.workspace.name) {
            const workspaceName = this.workspaceName.replace('-', '_');
            const onDiskPath = path.join(vscode.workspace.rootPath || '', 'target', 'doc', workspaceName, 'index.html');
            // if there's an error thrown here, it's the exists fn so we just leave the path as an empty string
            try {
                if (existsSync(onDiskPath)) {
                    this.fsPathToDocs = onDiskPath;
                }
            } catch { }
        }
    }

    getUriToDocs(): Option<vscode.Uri> {
        if (this.fsPathToDocs !== '') {
            return Option.lift(vscode.Uri.file(this.fsPathToDocs).with({ scheme: 'vscode-resource' }));
        } else {
            return Option.lift<vscode.Uri>();
        }
    }

    getWorkspaceName(): string {
        return this.workspaceName;
    }
}
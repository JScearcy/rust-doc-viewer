import * as vscode from 'vscode';
import * as path from 'path';
import { Option } from './option';
import { readdir, createReadStream } from 'fs';
import { Utilities, Queue } from './utilities';
import { createInterface } from 'readline';

export class Configuration {
    private fsPathToDocs: string;
    private workspaceName: string;

    constructor(workspaceName: string, workspacePath: string) {
        this.workspaceName = workspaceName;
        this.fsPathToDocs = workspacePath;
    }

    static async createConfiguration(): Promise<Configuration> {
        if (vscode.workspace.workspaceFolders) {
            const subDirectories = await this.getRustDirectories(vscode.workspace.workspaceFolders);
            if (subDirectories && subDirectories.length > 0) {
                const quickPickOptions: vscode.QuickPickOptions = {
                    placeHolder: 'Select project to display',
                };
                const quickPickSelection = await vscode.window.showQuickPick(subDirectories, quickPickOptions);
                if (quickPickSelection) {
                    const packageName = await this.getCargoPackageName(quickPickSelection);
                    const docsPath = path.join(quickPickSelection, 'target', 'doc', packageName, 'index.html');
                    return Promise.resolve(new Configuration(packageName, docsPath));
                } else {
                    return this.rejectInstantiation('Please select a folder to display');
                }
            }
        }

        return this.rejectInstantiation('Could not find a valid folder within the workspace/selected workspace folder');
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

    private static async getCargoPackageName(projectFolderPath: string): Promise<string> {
        const packageCargoPath = path.join(projectFolderPath, 'Cargo.toml');
        const packageCargoReadStream = createReadStream(packageCargoPath);
        let packageName = '';
        const rl = createInterface({ input: packageCargoReadStream, });
        await new Promise((resolve) => {
            rl.on('line', (input: string) => {
                if (input.includes('name')) {
                    const nameQuoted = input
                        .split(' = ')[1]
                        .trim();
                    // this is length - 2 to remove the last quote
                    packageName = nameQuoted.substr(1, nameQuoted.length - 2);
                    rl.close();
                }
            });
            rl.on('close', () => resolve());
        });
        return packageName;
    }

    private static async getRustDirectories(workspaceFolders: vscode.WorkspaceFolder[]): Promise<string[]> {
        const rustDirectories = new Set<string>();
        for (let i = 0; i < workspaceFolders.length; i++) {
            const workspaceFolder = workspaceFolders[i];
            const subDirectories = await this.getRustSubDirectories(workspaceFolder);
            subDirectories.forEach(dir => rustDirectories.add(dir));
        }

        return Array.from(rustDirectories);
    }

    private static async getRustSubDirectories(workspaceFolder: vscode.WorkspaceFolder): Promise<string[]> {
        const readDirPromise = Utilities.toPromise(readdir);
        const rustDirectories = new Set<string>();
        const subDirQueue = new Queue<string>();
        subDirQueue.enqueue(workspaceFolder.uri.fsPath);

        while (!subDirQueue.isEmpty()) {
            const folderToSearch = subDirQueue.dequeue();
            const folderChildren = await readDirPromise<string[]>(folderToSearch).catch(() => [] as string[]);
            if (folderChildren.indexOf('target') >= 0) {
                rustDirectories.add(folderToSearch);
            } else {
                const visibleChildren = folderChildren
                    .filter(folder => !(/(^|\/)\.[^\/\.]/g).test(folder))
                    .map(folder => path.join(folderToSearch, folder));
                subDirQueue.enqueueMany(visibleChildren);
            }
        }

        return Array.from(rustDirectories);
    }

    private static rejectInstantiation(message: string): Promise<any> {
        return Promise.reject(`Configuration creation failed: ${message}`);
    }
}
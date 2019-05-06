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
        // TODO: Add config path, requires much more work as the view can't retrieve the files directly - must be embedded
        // const configuration = vscode.workspace.getConfiguration('rustDocViewer');
        // const configPath: string | undefined = configuration.get('path');
        // if (configPath) {
        //     this.fsPathToDocs = path.join(configPath, 'index.html');
        // }
        if (vscode.workspace.workspaceFolders) {
            let selectedFolderName = vscode.workspace.workspaceFolders[0] ? vscode.workspace.workspaceFolders[0].name : '';
            if (vscode.workspace.workspaceFolders.length > 1) {
                const quickPickSelectOptions = vscode.workspace.workspaceFolders.map(folder => folder.name);
                const quickPickOptions: vscode.QuickPickOptions = {
                    placeHolder: 'Select folder with docs to display',
                };
                const quickPickSelection = await vscode.window.showQuickPick(quickPickSelectOptions, quickPickOptions);
                if (quickPickSelection) {
                    selectedFolderName = quickPickSelection;
                }
            }

            const workspaceFolder = vscode.workspace.workspaceFolders.find(folder => folder.name === selectedFolderName);
            if (workspaceFolder) {
                const projectFolderPath = await this.getProjectFolderPath(workspaceFolder);
                if (projectFolderPath) {
                    const packageName = await this.getCargoPackageName(projectFolderPath, workspaceFolder);
                    const docsPath = path.join(projectFolderPath, 'target', 'doc', packageName, 'index.html');
                    return Promise.resolve(new Configuration(packageName, docsPath));
                }
            }
        }

        return Promise.reject('Configuration creation failed, could not find a valid folder within the workspace/selected workspace folder');
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

    private static async getCargoPackageName(projectFolderPath: string, workspaceFolder: vscode.WorkspaceFolder): Promise<string> {
        const packageCargoPath = path.join(projectFolderPath, 'Cargo.toml');
        const packageCargoReadStream = createReadStream(packageCargoPath);
        let packageName = workspaceFolder.name;
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

    private static async getProjectFolderPath(workspaceFolder: vscode.WorkspaceFolder): Promise<string> {
        const readDirPromise = Utilities.toPromise(readdir);
        let folderToSearch = workspaceFolder.uri.fsPath;
        let subDirQueue = new Queue<string>();
        let projectPath = '';
        do {
            let folderChildren = await readDirPromise<string[]>(folderToSearch).catch(() => [] as string[]);
            if (folderChildren.indexOf('target') >= 0) {
                projectPath = folderToSearch;
                break;
            } else {
                folderChildren = folderChildren
                    .filter(folder => !(/(^|\/)\.[^\/\.]/g).test(folder))
                    .map(folder => path.join(folderToSearch, folder));
                subDirQueue.enqueueMany(folderChildren);
            }
            if (!subDirQueue.isEmpty()) {
                folderToSearch = subDirQueue.dequeue();
            }
        } while (!subDirQueue.isEmpty());

        return projectPath;
    }
}
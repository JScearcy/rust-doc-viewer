import * as vscode from 'vscode';
import * as path from 'path';
import { parse } from 'toml';
import { Option } from './option';
import { existsSync, readdir, readFileSync } from 'fs';
import { Utilities, Queue } from './utilities';

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
                    const [packageName, packagePath] = await this.getCargoPackagePath(quickPickSelection);
                    return Promise.resolve(new Configuration(packageName, packagePath));
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

    private static async getCargoPackagePath(projectFolderPath: string): Promise<[string, string]> {
        const packageCargoPath = path.join(projectFolderPath, 'Cargo.toml');
        const packageCargoString = readFileSync(packageCargoPath, 'utf-8');
        const packageCargo = parse(packageCargoString);
        if (packageCargo.workspace) {
            const quickPickOptions: vscode.QuickPickOptions = {
                placeHolder: 'Select package from the workspace to display',
            };
            const packageName = await vscode.window.showQuickPick(packageCargo.workspace.members, quickPickOptions);
            const packagePath = this.getPackagePath(projectFolderPath, packageName || '');
            return [packageName || '', packagePath];
        } else {
            let packageName = packageCargo.package.name;
            let packagePath = this.getPackagePath(projectFolderPath, packageName);
            // if the name isn't a valid path to the index, check lib and bin names as it might be a split project
            if (!existsSync(packagePath)) {
                packageName = packageCargo.lib && packageCargo.lib.name;
                packagePath = this.getPackagePath(projectFolderPath, packageName);
            }

            if (!existsSync(packagePath)) {
                packageName = packageCargo.bin && packageCargo.bin.name;
                packagePath = this.getPackagePath(projectFolderPath, packageName);
            }

            return [packageName, packagePath];
        }
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

    private static getPackagePath(projectFolderPath: string, packageName: string): string {
        return path.join(projectFolderPath, 'target', 'doc', packageName, 'index.html');
    }

    private static rejectInstantiation(message: string): Promise<any> {
        return Promise.reject(`Configuration creation failed: ${message}`);
    }
}
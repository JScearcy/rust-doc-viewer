import * as vscode from 'vscode';
import * as path from 'path';
import { Option } from './option';
import { readdir, readdirSync, readFile, statSync } from 'fs';
import { parse } from 'toml';
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
            const [subDirectories, packageNames] = await this.getRustDirectories(vscode.workspace.workspaceFolders);
            let quickPickSelection;
            if (subDirectories && subDirectories.length === 1) {
                quickPickSelection = subDirectories[0];
            } else if (subDirectories && subDirectories.length > 0) {
                const quickPickOptions: vscode.QuickPickOptions = {
                    placeHolder: 'Select project to display',
                };
                const quickPickSelectionOpt = await vscode.window.showQuickPick(subDirectories, quickPickOptions);
                if (quickPickSelectionOpt) {
                    quickPickSelection = quickPickSelectionOpt;
                }
            }

            if (quickPickSelection) {
                const [packageName, packagePath] = await this.getCargoPackagePath(quickPickSelection, packageNames);
                return Promise.resolve(new Configuration(packageName, packagePath));
            } else {
                return this.rejectInstantiation('Please select a folder to display');
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

    private static async getCargoPackagePath(projectFolderPath: string, packageNames: string[]): Promise<[string, string]> {
        const packageTargetPath = path.join(projectFolderPath, 'target', 'doc');
        const readDirs = readdirSync(packageTargetPath)
            .reduce((docDirectories: string[], readdirItem) => {
                const stats = statSync(path.join(packageTargetPath, readdirItem));
                if (
                    stats.isDirectory() &&
                    packageNames.some(item => item === readdirItem)
                ) {
                    docDirectories.push(readdirItem);
                }

                return docDirectories;
            }, []);

        if (readDirs.length > 1) {
            const quickPickOptions: vscode.QuickPickOptions = {
                placeHolder: 'Select package from the workspace to display',
            };
            const packagePathOpt = await vscode.window.showQuickPick(readDirs, quickPickOptions);
            if (packagePathOpt) {
                const packageName = this.formatPackageName(packagePathOpt);
                const packagePath = this.getPackagePath(projectFolderPath, packageName);
                return [packageName, packagePath];
            }
        } else if (readDirs.length === 1) {
            const packageName = this.formatPackageName(readDirs[0]);
            const packagePath = this.getPackagePath(projectFolderPath, packageName);
            return [packageName, packagePath];
        }

        return ['', ''];
    }

    private static formatPackageName(packageName: string): string {
        return packageName.split('-').join('_');
    }

    private static async getRustDirectories(workspaceFolders: vscode.WorkspaceFolder[]): Promise<[string[], string[]]> {
        const rustDirectories = new Set<string>();
        const rustPackages = new Set<string>();
        for (let i = 0; i < workspaceFolders.length; i++) {
            const workspaceFolder = workspaceFolders[i];
            const [subDirectories, packages] = await this.getRustSubDirectories(workspaceFolder);
            subDirectories.forEach(dir => rustDirectories.add(dir));
            packages.forEach((val) => rustPackages.add(this.formatPackageName(val)));
        }

        return [Array.from(rustDirectories), Array.from(rustPackages)];
    }

    private static async getRustSubDirectories(workspaceFolder: vscode.WorkspaceFolder): Promise<[string[], string[]]> {
        const readDirPromise = Utilities.toPromise(readdir);
        const readFilePromise = Utilities.toPromise(readFile); 
        const targetDirectories = new Set<string>();
        const packageNames = new Set<string>();
        const subDirQueue = new Queue<string>();
        subDirQueue.enqueue(workspaceFolder.uri.fsPath);

        while (!subDirQueue.isEmpty()) {
            const folderToSearch = subDirQueue.dequeue();
            const folderChildren = await readDirPromise<string[]>(folderToSearch).catch(() => [] as string[]);
            if (folderChildren.indexOf('target') >= 0) {
                targetDirectories.add(folderToSearch);
            }
            if (folderChildren.indexOf('Cargo.toml') >= 0) {
                const cargoPath = path.join(folderToSearch, 'Cargo.toml');
                const cargoFile: string = await readFilePromise(cargoPath, { encoding: 'utf8' });
                const cargoFileDeserialized = parse(cargoFile);
                if (cargoFileDeserialized && cargoFileDeserialized.package) {
                    packageNames.add(cargoFileDeserialized.package.name);
                }
            }

            const visibleChildren = folderChildren
                .filter(folder => !(/(^|\/)\.[^\/\.]/g).test(folder))
                .map(folder => path.join(folderToSearch, folder));
            subDirQueue.enqueueMany(visibleChildren);
        }

        return [Array.from(targetDirectories), Array.from(packageNames)];
    }

    private static getPackagePath(projectFolderPath: string, packageName: string): string {
        return path.join(projectFolderPath, 'target', 'doc', packageName, 'index.html');
    }

    private static rejectInstantiation(message: string): Promise<any> {
        return Promise.reject(`Configuration creation failed: ${message}`);
    }
}
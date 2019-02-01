import * as vscode from 'vscode';
import * as path from 'path';

export class Utilities {
    static hrefReplacer(data: string, srcPath: vscode.Uri, returnPath = false): string {
        const linkMatcher = /href=["']([a-zA-Z0-9_\-#\.\/]+)["']/g;
        return Utilities.pathReplacer(linkMatcher, data, srcPath, (newPath) => `href="${newPath}"`);
    }
    
    static srcReplacer(data: string, srcPath: vscode.Uri): string {
        const srcMatcher = /src="([a-zA-Z0-9-\.\/]+)"/g;
        return Utilities.pathReplacer(srcMatcher, data, srcPath, (newPath) => `src="${newPath}"`);
    }
    
    static pathReplacer(matcher: RegExp, data: string, srcPath: vscode.Uri, builder: (newPath: string) => string): string {
        return data.replace(matcher, (_, pathMatch) => {
            const newVsPath = Utilities.pathFromRelative(pathMatch, srcPath).with({ scheme: 'vscode-resource' }).toString(true);
            return builder(newVsPath);
        });
    }
    
    static pathFromRelative(relPath: string, srcPath: vscode.Uri): vscode.Uri {
        const newPath = path.join(srcPath.fsPath, '../', relPath);
    
        return vscode.Uri.file(newPath);
    }
}
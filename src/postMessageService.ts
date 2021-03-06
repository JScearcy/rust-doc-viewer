import * as vscode from 'vscode';
import { Command, Message, Response } from './models';
import { Utilities } from './utilities';

export class PostMessageHandler {
    constructor(private rustDocSrc: vscode.Uri, private workspaceState: vscode.Memento) { }

    handleMessage(message: Message): Response | null {
        switch (message.command) {
            case Command.getUrl:
                if (message.el) {
                    const updatedHref = Utilities.hrefReplacer(message.el, this.rustDocSrc);
                    return { el: updatedHref, elId: message.elId };
                }
                return { elId: message.elId };
            case Command.newPage:
                if (message.path) {
                    const path = decodeURIComponent(message.path);
                    if (!path.includes('../')) {
                        const newSrc = vscode.Uri.parse(path);
                        this.rustDocSrc = newSrc;
                        return { page: newSrc, elId: message.elId };
                    }
                } else if (message.el) {
                    const relativePathArr = message.el.match(/href=["']([a-zA-Z0-9_\-#\.\/]+)["']/);
                    if (relativePathArr) {
                        const relativePath = relativePathArr[1];
                        if (relativePath) {
                            const pathToLoad = Utilities.pathFromRelative(relativePath, this.rustDocSrc);
                            this.rustDocSrc = pathToLoad;
                            return { page: pathToLoad, elId: message.elId };
                        }
                    }
                }
                return { elId: message.elId };
            case Command.setState:
                if (message.state) {
                    this.workspaceState.update('rustDocViewer', JSON.stringify(message.state));
                }
                return { elId: Command.setState.toString(), state: message.state };
            case Command.getState:
                let state: string = this.workspaceState.get('rustDocViewer', '{}');
                return { elId: Command.getState.toString(), state };
        }

        return null;
    }
}
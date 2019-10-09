import * as vscode from 'vscode';

export enum Command {
	getUrl,
	newPage,
}

export interface Message {
	command: Command;
    elId: string;
    el?: string;
    path?: string;
}

export interface Response {
    elId: string;
    el?: string;
    page?: vscode.Uri;
}
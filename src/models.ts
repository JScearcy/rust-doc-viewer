import * as vscode from 'vscode';

export enum Command {
    getUrl = 'getUrl',
    newPage = 'newPage',
    setState = 'setState',
    getState = 'getState',
}

export interface Message {
	command: Command;
    elId: string;
    el?: string;
    path?: string;
    state?: string;
}

export interface Response {
    elId: string;
    el?: string;
    page?: vscode.Uri;
    state?: string;
}
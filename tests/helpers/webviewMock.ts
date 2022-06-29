import { Uri, ViewColumn, Webview } from "vscode";

export const getWebviewMock = () => ({
  options: {},
  html: '<html></html>',
  onDidReceiveMessage: () => ({ dispose: () => {} }),
  postMessage: function (message: any): Thenable<boolean> {
    throw new Error('Function not implemented.');
  },
  asWebviewUri: (localResource: Uri) => localResource,
  cspSource: '',
});

export const getWebviewPanelMock = (webview: Webview) => ({
  viewType: '',
  title: '',
  webview,
  options: {},
  viewColumn: undefined,
  active: false,
  visible: false,
  onDidChangeViewState: () => ({ dispose: () => {} }),
  onDidDispose: () => ({ dispose: () => {} }),
  reveal: function (viewColumn?: ViewColumn | undefined, preserveFocus?: boolean | undefined): void {
    throw new Error('Function not implemented.');
  },
  dispose: function () {
    throw new Error('Function not implemented.');
  },
});

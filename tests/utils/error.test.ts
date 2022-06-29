import { showError } from '../../src/utils/error';
// @ts-ignore
import * as mockVscode from '../../__mocks__/vscode';

describe('error util', () => {
  it('', () => {
    const mockErrMsg = 'Mock err msg';

    showError(mockErrMsg);

    expect(mockVscode.window.showErrorMessage).toBeCalledWith(`Rust: Docs Viewer: ${mockErrMsg}`);
  });
});

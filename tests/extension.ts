import { activate } from '../src/extension';
// @ts-ignore
import * as mockVscode from '../__mocks__/vscode';

describe('extension', () => {
  it('should register command', () => {
    const mockContext = {
      subscriptions: [],
    };

    activate(mockContext as any);

    expect(mockVscode.commands.registerCommand).toHaveBeenCalled();
    expect(mockContext.subscriptions.length).toBe(1);
  });
});

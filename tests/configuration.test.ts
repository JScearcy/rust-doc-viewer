import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { isSome, none, Some } from 'fp-ts/Option';
import { WorkspaceConfiguration, WorkspaceFolder } from 'vscode';
import { Configuration, getConfiguration } from '../src/configuration';
// @ts-ignore
import * as mockVscode from '../__mocks__/vscode';

jest.mock('fs', () => jest.createMockFromModule('fs'));
jest.mock('fs/promises', () => jest.createMockFromModule('fs/promises'));

describe('configuration', () => {
  const mockExtensionPath = 'mockExtensionPath';
  const mockToml = `[package]
  name = "unit-test"
  `;
  const mockWorkspaceFolder: WorkspaceFolder = {
    name: 'mockWorkspaceName',
    uri: {
      authority: '',
      fragment: '',
      fsPath: '/users/unit/test',
      path: '',
      query: '',
      scheme: '',
      toJSON: jest.fn(),
      with: jest.fn(),
    },
    index: 0
  };
  const mockCargoDirent = {
    name: 'Cargo.toml',
  };
  const mockDocDirent = {
    name: 'doc',
  };

  it('should return none if no workspaces', async () => {
    const result = await getConfiguration(mockExtensionPath);

    expect(result).toEqual(none);
  });

  it('should return some config with only extension when 1 workspace and no files found', async () => {
    (fsPromises.readdir as any).mockResolvedValue([]);

    (mockVscode.workspace as unknown as WorkspaceConfiguration).workspaceFolders.push(mockWorkspaceFolder);
    const result = await getConfiguration(mockExtensionPath);

    expect(isSome(result)).toBe(true);
    expect((result as Some<Configuration>).value.extensionPath).toBe(mockExtensionPath);
  });

  it('should return some config when manifest is found', async () => {
    (fsPromises.readdir as any).mockResolvedValue([mockDocDirent, mockCargoDirent]);
    (fsPromises.readFile as any).mockResolvedValue(mockToml);
    (fs.existsSync as any).mockReturnValue(true);

    (mockVscode.workspace as unknown as WorkspaceConfiguration).workspaceFolders.push(mockWorkspaceFolder);
    const result = await getConfiguration(mockExtensionPath);

    expect(isSome(result)).toBe(true);
    const someResult = result as Some<Configuration>;
    expect(someResult.value.extensionPath).toBe(mockExtensionPath);
    expect(isSome(someResult.value.docsName)).toBe(true);
    expect(isSome(someResult.value.docsPath)).toBe(true);
  });

  it('should return config from workspace name returned from quickPick', async () => {
    const throwawayWsFolder = {
      name: 'mockWorkspaceName',
      uri: {} as any,
      index: 1,
    };
    (fsPromises.readdir as any).mockResolvedValue([mockDocDirent, mockCargoDirent]);
    (fsPromises.readFile as any).mockResolvedValue(mockToml);
    (fs.existsSync as any).mockReturnValue(true);
    mockVscode.window.showQuickPick.mockResolvedValue(mockWorkspaceFolder.name);

    (mockVscode.workspace as unknown as WorkspaceConfiguration).workspaceFolders.push(throwawayWsFolder);
    (mockVscode.workspace as unknown as WorkspaceConfiguration).workspaceFolders.push(mockWorkspaceFolder);
    const result = await getConfiguration(mockExtensionPath);

    expect(isSome(result)).toBe(true);
    const someResult = result as Some<Configuration>;
    expect(someResult.value.extensionPath).toBe(mockExtensionPath);
    expect(isSome(someResult.value.docsName)).toBe(true);
    expect(isSome(someResult.value.docsPath)).toBe(true);
  });

  it('should return config from name returned from quickPick when multiple Cargo.toml', async () => {
    const throwawayCargoDirent = {
      name: 'Cargo.toml',
    };
    const throwawayToml = `[package]
    name = "throwaway-unit-test"
    `;
    (fsPromises.readdir as any).mockResolvedValue([mockDocDirent, mockCargoDirent, throwawayCargoDirent]);
    (fsPromises.readFile as any).mockResolvedValueOnce(mockToml).mockResolvedValueOnce(throwawayToml);
    (fs.existsSync as any).mockReturnValueOnce(false).mockReturnValueOnce(true);
    mockVscode.window.showQuickPick.mockResolvedValue(mockWorkspaceFolder.name);

    (mockVscode.workspace as unknown as WorkspaceConfiguration).workspaceFolders.push(mockWorkspaceFolder);
    const result = await getConfiguration(mockExtensionPath);

    expect(isSome(result)).toBe(true);
    const someResult = result as Some<Configuration>;
    expect(someResult.value.extensionPath).toBe(mockExtensionPath);
    expect(isSome(someResult.value.docsName)).toBe(true);
    expect(isSome(someResult.value.docsPath)).toBe(true);
  });
});

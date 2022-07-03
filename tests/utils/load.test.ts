import { some } from 'fp-ts/Option';
import * as fs from 'fs/promises';
import { join } from 'path';
import { setError, setRawDoc } from '../../src/utils/actions';
import { loadDoc } from '../../src/utils/load';
import * as state from '../../src/utils/state';

jest.mock('fs/promises');

describe('load util', () => {
  const mockReadFile = jest.spyOn(fs, 'readFile');
  beforeEach(() => {
    mockReadFile.mockRestore();
    jest.spyOn(state, 'update');
  });

  it('should update raw doc action on success', async () => {
    const mockFileData = 'mockVal';
    mockReadFile.mockResolvedValue(mockFileData);
    const mockPath = './mockPath';
    const mockPageKey = 'mockPageKey';
    await loadDoc(mockPath, mockPageKey);

    const expectedUpdate = setRawDoc(some(mockFileData));

    expect(mockReadFile).toBeCalledWith(join(mockPath, mockPageKey), 'utf-8');
    expect(state.update).toBeCalledWith(expectedUpdate);
  });

  it('should update with set error on error', async () => {
    const mockError = new Error('mock error');
    mockReadFile.mockRejectedValue(mockError);
    const mockPath = './mockPath';
    await loadDoc(mockPath);

    const expectedUpdate = setError([mockError.message]);

    expect(mockReadFile).toBeCalledWith(join(mockPath), 'utf-8');
    expect(state.update).toBeCalledWith(expectedUpdate);
  });
});

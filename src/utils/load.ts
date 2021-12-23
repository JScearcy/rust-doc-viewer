import { some } from 'fp-ts/Option';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { setError, setRawDoc } from './actions';
import { update } from './state';

export const loadDoc = async (filePath: string, pageKey?: string) => {
  const fullPath = join(filePath, pageKey || '');
  try {
    const file = await readFile(fullPath, 'utf-8');
    update(setRawDoc(some(file)));
  } catch (e: any) {
    update(setError([e]));
  }
};

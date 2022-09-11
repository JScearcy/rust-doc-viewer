import { some } from 'fp-ts/Option';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { setError, setRawDoc } from './actions';
import { update } from './state';

export const loadDoc = async (filePath: string, pageKey?: string) => {
  const fullPath = join(filePath, pageKey || 'index.html');
  try {
    const file = await readFile(fullPath, 'utf-8');
    update(setRawDoc(some(file)));
  } catch (e: any) {
    console.error('filePath', filePath, 'pageKey', pageKey);
    console.error(e);
    update(setError([e.message]));
  }
};

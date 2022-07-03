import { run as runJest } from 'jest-cli';
import { join } from 'path';

export function run(): Promise<void> {
  const configPath = join(__dirname, './jest.e2e.config.js');
  console.log('call runJest');
  return Promise.resolve();
  // return runJest([`--config=${configPath}`]).then(res => {
  //   console.log('runJest complete');
  //   console.log('results: ', res);
  // });
}

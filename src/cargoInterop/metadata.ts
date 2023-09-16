import { exec } from 'child_process';
import { Observable, from, mergeMap } from 'rxjs';
import { Option, some, none } from 'fp-ts/Option';

const versionTest = /cargo\s(\d+\.\d+\.\d+).*/i;

const cargoExists = (cwd?: string): Observable<boolean> => {
  return new Observable((subscriber) => {
    exec('cargo --version', { cwd, windowsHide: true }, (error, stdout, stderr) => {
      if (error || stderr) {
        subscriber.next(false);
      } else if (stdout) {
        subscriber.next(versionTest.test(stdout));
      }
      subscriber.complete();
    });
  });
};

const cargoMetadata = (cwd?: string): Observable<Option<Metadata>> => {
  return new Observable((subscriber) => {
    exec('cargo metadata --no-deps --format-version 1 -q', { cwd, windowsHide: true }, (error, stdout, stderr) => {
      if (error || stderr) {
        subscriber.next(none);
      } else if (stdout) {
        try {
          const metadata: Metadata = JSON.parse(stdout);
          if (metadata) {
            subscriber.next(some(metadata));
          } else {
            subscriber.next(none);
          }
        } catch {
          subscriber.next(none);
        }
      }

      subscriber.complete();
    });
  });
};

export const cargoSafeMetadata = (cwd?: string): Observable<Option<Metadata>> => {
  return cargoExists().pipe(
    mergeMap((exists) => {
      if (exists) {
        return cargoMetadata(cwd);
      } else {
        return from([none]);
      }
    })
  );
};

type Metadata = {
  packages: Package[];
  workspace_members: string[];
  workspace_default_members: string[];
  resolve: any;
  target_directory: string;
  version: number;
  workspace_root: string;
};

type Package = {
  name: string;
  version: string;
  id: string;
  license: string;
  license_file: string;
  description: string;
  source: string | null;
  dependencies: Dependency[];
  targets: Target[];
  features: Features;
  manifest_path: string;
};

export interface Dependency {
  name: string;
  source: string;
  req: string;
  kind: 'dev' | 'build' | null;
  rename: string | null;
  optional: boolean;
  uses_default_features: boolean;
  features: string[];
  target: string | null;
  path?: string;
  registry: string | null;
}

export interface Target {
  kind: string[];
  crate_types: string[];
  name: string;
  src_path: string;
  edition: string;
  doc: boolean;
  doctest: boolean;
  test: boolean;
}

export interface Features {}

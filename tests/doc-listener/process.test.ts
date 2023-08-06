import { none, some } from 'fp-ts/lib/Option';
import { Subscription } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { Memento, Webview, WebviewPanel } from 'vscode';
import { processListener } from '../../src/doc-listener/process';
import { setBatch, setConfig, setParsedDoc, setRawDoc } from '../../src/utils/actions';
import { PageKeyType, slice, StateKey, update } from '../../src/utils/state';
// @ts-ignore
import { getWebviewMock, getWebviewPanelMock, getWorkspaceStateMock } from '../helpers/webviewMock';

describe('process', () => {
  let webviewMock: Webview;
  let webviewPanelMock: WebviewPanel;
  let workspaceStateMock: Memento;
  let cleanupSub: Subscription | null;
  let testScheduler: TestScheduler;
  const configuration = { customTargetDir: none, docsName: none, docsPath: some('./docs'), extensionPath: '', rustShareDocPath: none };
  const pageKey = { val: some('index.html'), type: PageKeyType.LocalDoc };
  afterEach(() => {
    if (cleanupSub) {
      cleanupSub.unsubscribe();
      cleanupSub = null;
    }
  });

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      // asserting the two objects are equal - required
      // for TestScheduler assertions to work via your test framework
      // e.g. using chai.
      expect(actual).toEqual(expected);
    });
    webviewMock = getWebviewMock();
    webviewPanelMock = getWebviewPanelMock(webviewMock);
    workspaceStateMock = getWorkspaceStateMock();
  });

  it('does not set parsedDoc if missing config', () => {
    testScheduler.run((helpers) => {
      const sliceTest = slice([StateKey.configuration, StateKey.pageKey, StateKey.parsedDoc, StateKey.rawDoc]);
      cleanupSub = processListener({ slice: sliceTest, view: webviewPanelMock, workspaceState: workspaceStateMock });
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ configuration: none, pageKey, parsedDoc: none, rawDoc: some('<div></div>') }];

      update(setBatch([setParsedDoc(none), setRawDoc(some('<div></div>'))]));
      expectObservable(sliceTest).toBe(expected, values);
    });
  });

  it('does not set parsedDoc if missing config docsPath', () => {
    testScheduler.run((helpers) => {
      const sliceTest = slice([StateKey.configuration, StateKey.pageKey, StateKey.parsedDoc, StateKey.rawDoc]);
      cleanupSub = processListener({ slice: sliceTest, view: webviewPanelMock, workspaceState: workspaceStateMock });
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ configuration: some({ ...configuration, docsPath: none }), pageKey, parsedDoc: none, rawDoc: some('<div></div>') }];

      update(
        setBatch([
          setParsedDoc(none),
          setRawDoc(some('<div></div>')),
          setConfig(some({ ...configuration, docsPath: none })),
        ])
      );
      expectObservable(sliceTest).toBe(expected, values);
    });
  });

  it('does not set parsedDoc if rawDoc is none', () => {
    testScheduler.run((helpers) => {
      const sliceTest = slice([StateKey.configuration, StateKey.pageKey, StateKey.parsedDoc, StateKey.rawDoc]);
      cleanupSub = processListener({ slice: sliceTest, view: webviewPanelMock, workspaceState: workspaceStateMock });
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ configuration: some(configuration), pageKey, parsedDoc: none, rawDoc: none }];

      update(
        setBatch([
          setParsedDoc(none),
          setRawDoc(none),
          setConfig(some(configuration)),
        ])
      );
      expectObservable(sliceTest).toBe(expected, values);
    });
  });

  it('does set parsedDoc if rawDoc, config, docsPath is some', () => {
    testScheduler.run((helpers) => {
      const sliceTest = slice([StateKey.configuration, StateKey.pageKey, StateKey.parsedDoc, StateKey.rawDoc]);
      cleanupSub = processListener({ slice: sliceTest, view: webviewPanelMock, workspaceState: workspaceStateMock });
      const rawDoc = '<div>Test</div>';
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ configuration: some(configuration), pageKey, parsedDoc: some('<!DOCTYPE html><div>Test</div>'), rawDoc: some('<div>Test</div>') }];

      update(
        setBatch([
          setParsedDoc(none),
          setRawDoc(some(rawDoc)),
          setConfig(some(configuration)),
        ])
      );
      expectObservable(sliceTest).toBe(expected, values);
    });
  });

  it('does set parse links', () => {
    testScheduler.run((helpers) => {
      const sliceTest = slice([StateKey.configuration, StateKey.pageKey, StateKey.parsedDoc, StateKey.rawDoc]);
      cleanupSub = processListener({ slice: sliceTest, view: webviewPanelMock, workspaceState: workspaceStateMock });
      const rawDoc = '<div><a href="/test-link">testLink</a></div>';
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ configuration: some(configuration), pageKey, parsedDoc: some('<!DOCTYPE html><div><a href="docs/test-link">testLink</a></div>'), rawDoc: some('<div><a href="/test-link">testLink</a></div>') }];

      update(
        setBatch([
          setParsedDoc(none),
          setRawDoc(some(rawDoc)),
          setConfig(some(configuration)),
        ])
      );
      expectObservable(sliceTest).toBe(expected, values);
    });
  });

  it('does handle complex doc', () => {
    testScheduler.run((helpers) => {
      const sliceTest = slice([StateKey.configuration, StateKey.pageKey, StateKey.parsedDoc, StateKey.rawDoc]);
      cleanupSub = processListener({ slice: sliceTest, view: webviewPanelMock, workspaceState: workspaceStateMock });
      const rawDoc = `<body>
  <div>
    <a href="/test-link">testLink</a>
    <script src="/test-script"></script>
    <div id="rustdoc-vars" data-root-path="/root" data-search-js="/search-js" data-search-index-js="/search-index-js"></div>
    <button disabled id="testBtn">TestBtn</button>
  </div>
</body>`;
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ configuration: some(configuration), pageKey, parsedDoc: some(
        `<!DOCTYPE html><body><div id=\"doc-viewer-state\" data-state={}></div><body>
  <div>
    <a href="docs/test-link">testLink</a>
    <script src="docs/test-script"></script>
    <div id="rustdoc-vars" data-root-path="docs/root" data-search-js="docs/search-js" data-search-index-js="docs/search-index-js"></div>
    <button disabled id="testBtn">TestBtn</button>
  </div>
</body>`
      ), rawDoc: some(rawDoc) }];

      update(
        setBatch([
          setParsedDoc(none),
          setRawDoc(some(rawDoc)),
          setConfig(some(configuration)),
        ])
      );
      expectObservable(sliceTest).toBe(expected, values);
    });
  });
});

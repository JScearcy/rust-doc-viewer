import { none, some } from 'fp-ts/lib/Option';
import { TestScheduler } from 'rxjs/testing';
import { Disposable, Webview, WebviewPanel } from 'vscode';
import { processListener } from '../../src/doc-listener/process';
import { setBatch, setConfig, setParsedDoc, setRawDoc } from '../../src/utils/actions';
import { slice, StateKey, update } from '../../src/utils/state';
// @ts-ignore
import { getWebviewMock, getWebviewPanelMock } from '../helpers/webviewMock';

describe('process', () => {
  let webviewMock: Webview;
  let webviewPanelMock: WebviewPanel;
  let cleanupSub: Disposable | null;
  let testScheduler: TestScheduler;

  afterEach(() => {
    if (cleanupSub) {
      cleanupSub.dispose();
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
  });

  it('does not set parsedDoc if missing config', () => {
    testScheduler.run((helpers) => {
      cleanupSub = processListener(webviewPanelMock);
      const sliceTest = slice([StateKey.parsedDoc]);
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ parsedDoc: none }];

      update(setBatch([setParsedDoc(none), setRawDoc(some('<div></div>'))]));
      expectObservable(sliceTest).toBe(expected, values);
    });
  });

  it('does not set parsedDoc if missing config docsPath', () => {
    testScheduler.run((helpers) => {
      cleanupSub = processListener(webviewPanelMock);
      const sliceTest = slice([StateKey.parsedDoc]);
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ parsedDoc: none }];

      update(
        setBatch([
          setParsedDoc(none),
          setRawDoc(some('<div></div>')),
          setConfig(some({ customTargetDir: none, docsName: none, docsPath: none, extensionPath: '' })),
        ])
      );
      expectObservable(sliceTest).toBe(expected, values);
    });
  });

  it('does not set parsedDoc if rawDoc is none', () => {
    testScheduler.run((helpers) => {
      cleanupSub = processListener(webviewPanelMock);
      const sliceTest = slice([StateKey.parsedDoc]);
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ parsedDoc: none }];

      update(
        setBatch([
          setParsedDoc(none),
          setRawDoc(none),
          setConfig(some({ customTargetDir: none, docsName: none, docsPath: some('./'), extensionPath: '' })),
        ])
      );
      expectObservable(sliceTest).toBe(expected, values);
    });
  });

  it('does set parsedDoc if rawDoc, config, docsPath is some', () => {
    testScheduler.run((helpers) => {
      cleanupSub = processListener(webviewPanelMock);
      const rawDoc = '<div>Test</div>';
      const sliceTest = slice([StateKey.parsedDoc]);
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ parsedDoc: some('<!DOCTYPE html><div >Test</div>') }];

      update(
        setBatch([
          setParsedDoc(none),
          setRawDoc(some(rawDoc)),
          setConfig(some({ customTargetDir: none, docsName: none, docsPath: some('./'), extensionPath: '' })),
        ])
      );
      expectObservable(sliceTest).toBe(expected, values);
    });
  });

  it('does set parse links', () => {
    testScheduler.run((helpers) => {
      cleanupSub = processListener(webviewPanelMock);
      const rawDoc = '<div><a href="/test-link">testLink</a></div>';
      const sliceTest = slice([StateKey.parsedDoc]);
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ parsedDoc: some('<!DOCTYPE html><div ><a href="test-link">testLink</a></div>') }];

      update(
        setBatch([
          setParsedDoc(none),
          setRawDoc(some(rawDoc)),
          setConfig(some({ customTargetDir: none, docsName: none, docsPath: some('./'), extensionPath: '' })),
        ])
      );
      expectObservable(sliceTest).toBe(expected, values);
    });
  });

  it('does handle complex doc', () => {
    testScheduler.run((helpers) => {
      cleanupSub = processListener(webviewPanelMock);
      const rawDoc = `<body>
  <div>
    <a href="/test-link">testLink</a>
    <script src="/test-script"></script>
    <div id="rustdoc-vars" data-root-path="/root" data-search-js="/search-js" data-search-index-js="/search-index-js"></div>
    <button disabled id="testBtn">TestBtn</button>
  </div>
</body>`;
      const sliceTest = slice([StateKey.parsedDoc]);
      const { expectObservable } = helpers;
      const expected = '0';
      const values = [{ parsedDoc: some(
        `<!DOCTYPE html><body >
  <div >
    <a href="docs/test-link">testLink</a>
    <script src="docs/test-script"></script>
    <div id="rustdoc-vars" data-root-path="docs/root" data-search-js="docs/search-js" data-search-index-js="docs/search-index-js"></div>
    <button disabled id="testBtn">TestBtn</button>
  </div>
<script src=\"out/client/clientHandler.js\"></script><link rel=\"stylesheet\" type=\"text/css\" href=out/client/clientHandlerStyles.css></body>`
      ) }];

      update(
        setBatch([
          setParsedDoc(none),
          setRawDoc(some(rawDoc)),
          setConfig(some({ customTargetDir: none, docsName: none, docsPath: some('./docs'), extensionPath: '' })),
        ])
      );
      expectObservable(sliceTest).toBe(expected, values);
    });
  });
});

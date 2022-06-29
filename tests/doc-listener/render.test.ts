import { none, some } from 'fp-ts/lib/Option';
import { Disposable, Webview, WebviewPanel } from 'vscode';
import { renderListener } from '../../src/doc-listener/render';
import { setParsedDoc } from '../../src/utils/actions';
import { update } from '../../src/utils/state';
// @ts-ignore
import { getWebviewMock, getWebviewPanelMock } from '../helpers/webviewMock';

describe('render', () => {
  let webviewMock: Webview;
  let webviewPanelMock: WebviewPanel;
  let cleanupSub: Disposable | null;

  afterEach(() => {
    if(cleanupSub) {
      cleanupSub.dispose();
      cleanupSub = null;
    }
  });

  beforeEach(() => {
    webviewMock = getWebviewMock();
    webviewPanelMock = getWebviewPanelMock(webviewMock);
  });

  it('does not change webview if parsedDoc is none', () => {
    cleanupSub = renderListener(webviewPanelMock);
    update(setParsedDoc(none));

    expect(webviewMock.html).toBe('<html></html>');
  });

  it('sets html if parsedDoc is some', () => {
    const webViewResult = '<div>test</div>';
    cleanupSub = renderListener(webviewPanelMock);
    update(setParsedDoc(some(webViewResult)));

    expect(webviewMock.html).toBe(webViewResult);
  });
});

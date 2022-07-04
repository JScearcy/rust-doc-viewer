import { isExternal, subscriptionToDisposable } from '../../src/utils';
import * as vscode from '../../__mocks__/vscode';

describe('index utils', () => {
  it('should create a disposable from a subscription', () => {
    const mockSubscription = {
      unsubscribe: jest.fn(),
    };
    const disposable = subscriptionToDisposable(mockSubscription as any);
    disposable.dispose();

    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });

  it('should detect external rust doc links', () => {
    // expect false if uri is falsy
    vscode.Uri.parse.mockReturnValue(undefined);
    expect(isExternal('')).toBeFalsy();
    
    // expect false if uri is http but does not match regex
    vscode.Uri.parse.mockReturnValue({ authority: 'doc.no-match.com', scheme: 'http' });
    expect(isExternal('http://doc.no-match.com')).toBeFalsy();

    // expect false if uri is https but does not match regex
    vscode.Uri.parse.mockReturnValue({ authority: 'doc.no-match.com', scheme: 'https' });
    expect(isExternal('https://doc.no-match.com')).toBeFalsy();

    // expect true if uri is http and matches regex
    vscode.Uri.parse.mockReturnValue({ authority: 'doc.rust-lang.org', scheme: 'http' });
    expect(isExternal('http://doc.rust-lang.org/nightly/std/primitive.u64.html')).toBeTruthy();

    // expect true if uri is https and matches regex
    vscode.Uri.parse.mockReturnValue({ authority: 'doc.rust-lang.org', scheme: 'http' });
    expect(isExternal('https://doc.rust-lang.org/nightly/std/primitive.u64.html')).toBeTruthy();
  });
});

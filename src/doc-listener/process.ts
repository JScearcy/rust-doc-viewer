import { isNone, isSome, some } from 'fp-ts/Option';
import { State, StateKey, update } from '../utils/state';
import * as htmlparser2 from 'htmlparser2';
import { Memento, Uri, WebviewPanel } from 'vscode';
import { join } from 'path';
import { setError, setParsedDoc } from '../utils/actions';
import { isExternal } from '../utils';
import { ListenerOpts } from './listener';

// TODO: this is not exhaustive
const transformTags = ['a', 'img', 'link', 'script'];
const selfClosing = ['br', 'img', 'input', 'link', 'meta'];
let buf = '';
const resetBuf = () => (buf = '<!DOCTYPE html>');

const pathFromRelative = (relPath: string, srcPath: string): Uri => {
  const newPath = join(srcPath, relPath);

  return Uri.file(newPath);
};

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const rustDocVarAttributes = {
  dataRootPath: 'data-root-path',
  dataSearch: 'data-search-js',
  dataSearchIndex: 'data-search-index-js',
  dataSettingsCss: `data-settings-css`,
  dataSettingsJs: 'data-settings-js',
  dataStaticRootPath: 'data-static-root-path',
} as const;
const getParser = (view: WebviewPanel, srcPath: string, extensionPath: string, workspaceState: Memento) =>
  new htmlparser2.Parser({
    onopentag(name, attributes) {
      if (name === 'head') {
        const localScriptUri = view.webview.asWebviewUri(
          Uri.file(join(extensionPath, 'out', 'client', 'clientHandler.js'))
        );
        const historyStylesUri = view.webview.asWebviewUri(
          Uri.file(join(extensionPath, 'out', 'client', 'clientHandlerStyles.css'))
        );
        buf = [
          `${buf}<${name}>`,
          `<script src="${localScriptUri.toString(true)}"></script>`,
          `<link rel="stylesheet" type="text/css" href=${historyStylesUri}>`,
        ].join('');
      } else if (name === 'body') {
        let stateRaw: string = workspaceState.get('rustDocViewer', '{}');
        buf = [`${buf}<${name}>`, `<div id="doc-viewer-state" data-state=${stateRaw}></div>`].join('');
        // search depends on a div containing path for search js, and base uri's
      } else if (
        (name === 'div' && attributes['id'] === 'rustdoc-vars') ||
        (name === 'meta' && attributes['name'] === 'rustdoc-vars')
      ) {
        const hasRootPath = Boolean(attributes[rustDocVarAttributes.dataStaticRootPath]);
        const keys = [
          rustDocVarAttributes.dataRootPath,
          hasRootPath ? false : rustDocVarAttributes.dataSearch,
          rustDocVarAttributes.dataSearchIndex,
          rustDocVarAttributes.dataStaticRootPath,
        ].filter((x) => x);
        keys.forEach((key) => {
          if (typeof key === 'string' && attributes[key]) {
            const path = pathFromRelative(attributes[key], srcPath);
            attributes[key] = view.webview.asWebviewUri(path).toString(true);
          }
        });
      } else if (transformTags.includes(name)) {
        const uriAttr = attributes['src'] ? 'src' : 'href';
        if (
          attributes[uriAttr] &&
          !isExternal(attributes[uriAttr]) &&
          !attributes[uriAttr].includes('javascript:void')
        ) {
          const uri = view.webview.asWebviewUri(pathFromRelative(attributes[uriAttr], srcPath));
          attributes[uriAttr] = uri.toString(true);
        }
      }

      const serializedAttrs = Object.entries(attributes).reduce((attrs, [attrName, attrVal]) => {
        if (attrVal) {
          return [...attrs, `${attrName}="${attrVal}"`];
        } else {
          return [...attrs, attrName];
        }
      }, [] as string[]);
      const newTag = serializedAttrs.length > 0 ? `<${name} ${serializedAttrs.join(' ')}>` : `<${name}>`;
      buf = `${buf}${newTag}`;
    },

    ontext(text) {
      buf = `${buf}${escapeHtml(text)}`;
    },

    onclosetag(name) {
      if (!selfClosing.includes(name)) {
        buf = `${buf}</${name}>`;
      }
    },

    onerror(err) {
      update(setError([err.message]));
    },
  });

type ProcessListenerOpts = ListenerOpts<
  Pick<State, StateKey.configuration | StateKey.pageKey | StateKey.parsedDoc | StateKey.rawDoc>
> & {
  view: WebviewPanel;
  workspaceState: Memento;
};

export const processListener = ({ slice, view, workspaceState }: ProcessListenerOpts) =>
  slice.subscribe(({ configuration, pageKey, parsedDoc, rawDoc }) => {
    if (isNone(parsedDoc) && isSome(rawDoc) && isSome(configuration) && isSome(configuration.value.docsPath)) {
      resetBuf();
      const parser = getParser(
        view,
        configuration.value.docsPath.value,
        configuration.value.extensionPath,
        workspaceState
      );
      parser.write(rawDoc.value);
      parser.end();
      update(setParsedDoc(some(buf)));
    }
  });

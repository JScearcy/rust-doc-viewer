import { CommandKey } from './command';

const bubbleTargets = ['SUMMARY'];

export const eventShouldBubble = (element: Element) => {
  const inSettings = !!element.closest('.settings');
  return inSettings || bubbleTargets.includes(element.tagName);
};

// settings-menu button opens modal, no need to load a new file from this button
export const eventHandled = (element: Element) => {
  const inSettings = element.id === 'settings-menu' || !!element.closest('#settings-menu');
  return inSettings;
};

export const navigateClickHandler = (element: HTMLElement) => {
  const el = getElementToHandle(element);
  if (el) {
    const href = decodeURIComponent((<any>el).href) ?? '';
    if (href?.includes('#')) {
      const id = href.split('#')[1];
      return {
        commandType: CommandKey.navigateAnchor,
        payload: {
          id,
          path: href,
        },
      };
    } else if (href === '') {
      return handleElementOuterHtml(el);
    } else {
      return handleElementWithHref(el as HTMLElement & { href: string });
    }
  }
};

const getElementToHandle = (element: HTMLElement) => {
  if (validNavigableEl(element)) {
    return element;
  } else {
    return element.closest('a');
  }
};

const validNavigableEl = (element: Element): boolean => element.classList.contains('crate') || element.tagName === 'A';

const handleElementWithHref = (el: HTMLElement & { href: string }) => getNewPageCommand(el.id, el.href);

const handleElementOuterHtml = (el: HTMLElement) => getNewPageCommand(el.id, el.outerHTML);

const getNewPageCommand = (id: string, path: string) => ({ commandType: CommandKey.newPage, payload: { id, path } });

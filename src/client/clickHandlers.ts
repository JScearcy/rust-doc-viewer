import { CommandKey } from './command';

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

/**
 * Scroll to the given element
-* @param node Element to scroll to
-* @param baseElement Container element used to calculate offset
-* @param offset Additional offset
 */

import { scrollTo } from 'seamless-scroll-polyfill';

export default (
  node: HTMLElement,
  baseElement: HTMLElement,
  offset: number
) => {
  scrollTo(window, {
    behavior: 'smooth',
    top:
      node.getBoundingClientRect().top -
      baseElement.getBoundingClientRect().top -
      offset,
  });
};

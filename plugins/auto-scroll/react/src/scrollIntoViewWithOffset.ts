import { scrollTo } from "seamless-scroll-polyfill";

/**
 * Scroll to the given element with an offset
 * @param node Element to scroll to
 * @param baseElement Container element used to calculate offset
 * @param offset Additional offset
 */
export function scrollIntoViewWithOffset(
  node: HTMLElement,
  baseElement: HTMLElement,
  offset: number,
) {
  scrollTo(window, {
    behavior: "smooth",
    top:
      node.getBoundingClientRect().top -
      baseElement.getBoundingClientRect().top -
      offset,
  });
}

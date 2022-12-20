import type { ReactPlayer, ReactPlayerPlugin } from '@player-ui/react';
import type { Player } from '@player-ui/player';
import React from 'react';
import { AutoScrollProvider } from './hooks';

export enum ScrollType {
  ValidationError,
  FirstAppearance,
  Unknown,
}

export interface AutoScrollManagerConfig {
  /** Config to auto-scroll on load */
  autoScrollOnLoad?: boolean;
  /** Config to auto-focus on an error */
  autoFocusOnErrorField?: boolean;
}

/** A plugin to manage scrolling behavior */
export class AutoScrollManagerPlugin implements ReactPlayerPlugin {
  name = 'auto-scroll-manager';

  /** Toggles if we should auto scroll to to the first failed validation on page load */
  private autoScrollOnLoad: boolean;

  /** Toggles if we should auto scroll to the first failed validation on navigation failure */
  private autoFocusOnErrorField: boolean;

  /** tracks if its the initial page render */
  private initialRender: boolean;

  /** tracks if the navigation failed */
  private failedNavigation: boolean;

  /** map of scroll type to set of ids that are registered under that type */
  private alreadyScrolledTo: Array<string>;
  private scrollFn: (
    scrollableElements: Map<ScrollType, Set<string>>
  ) => string;

  constructor(config: AutoScrollManagerConfig) {
    this.autoScrollOnLoad = config.autoScrollOnLoad ?? false;
    this.autoFocusOnErrorField = config.autoFocusOnErrorField ?? false;
    this.initialRender = false;
    this.failedNavigation = false;
    this.alreadyScrolledTo = [];
    this.scrollFn = this.calculateScroll.bind(this);
  }

  getFirstScrollableElement(idList: Set<string>, type: ScrollType) {
    const highestElement = {
      id: '',
      ypos: 0,
    };
    const ypos = window.scrollY;
    idList.forEach((id) => {
      const element = document.getElementById(id);

      // if we are looking at validation errors, make sure the element is invalid
      if (
        type === ScrollType.ValidationError &&
        element?.getAttribute('aria-invalid') === 'false'
      ) {
        return;
      }

      // if we are just looking at elements that just appeared, make sure we haven't
      // scrolled to them before
      if (type === ScrollType.FirstAppearance) {
        if (this.alreadyScrolledTo.indexOf(id) !== -1) {
          return;
        }

        this.alreadyScrolledTo.push(id);
      }

      const epos = element?.getBoundingClientRect().top;

      if (
        epos &&
        (epos + ypos > highestElement.ypos || highestElement.ypos === 0)
      ) {
        highestElement.id = id;
        highestElement.ypos = ypos - epos;
      }
    });

    return highestElement.id;
  }

  calculateScroll(scrollableElements: Map<ScrollType, Set<string>>) {
    let currentScroll = ScrollType.FirstAppearance;

    if (this.initialRender) {
      if (this.autoScrollOnLoad) {
        currentScroll = ScrollType.ValidationError;
      }

      this.initialRender = false;
    } else if (this.failedNavigation) {
      if (this.autoFocusOnErrorField) {
        currentScroll = ScrollType.ValidationError;
      }

      this.failedNavigation = false;
    }

    const elementList = scrollableElements.get(currentScroll);

    if (elementList) {
      const element = this.getFirstScrollableElement(
        elementList,
        currentScroll
      );

      return element ?? '';
    }

    return '';
  }

  // Hooks into player flow to determine what scroll targets need to be evaluated at specific lifecycle points
  apply(player: Player) {
    player.hooks.flowController.tap(this.name, (fc) => {
      fc.hooks.flow.tap(this.name, (flow) => {
        flow.hooks.transition.tap(this.name, () => {
          // Reset Everything
          this.initialRender = true;
          this.failedNavigation = false;
          this.alreadyScrolledTo = [];
        });
        flow.hooks.skipTransition.intercept({
          call: () => {
            this.failedNavigation = true;
          },
        });
      });
    });
  }

  applyReact(reactPlayer: ReactPlayer) {
    reactPlayer.hooks.webComponent.tap(this.name, (Comp) => {
      return () => {
        const { scrollFn } = this;

        return (
          <AutoScrollProvider getElementToScrollTo={scrollFn}>
            <Comp />
          </AutoScrollProvider>
        );
      };
    });
  }
}

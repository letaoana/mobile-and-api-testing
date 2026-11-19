import { byA11yId } from '../helpers/selectors.ts';

/**
 * Base class for every screen object. A screen is identified by a root element;
 * `waitForIsShown` is used as a synchronisation point instead of fixed pauses.
 */
export default abstract class BaseScreen {
  protected constructor(private readonly rootSelector: string) {}

  protected get root() {
    return $(this.rootSelector);
  }

  async waitForIsShown(isShown = true): Promise<void> {
    await this.root.waitForDisplayed({ reverse: !isShown });
  }

  /** Waits for an element to be displayed and taps it. */
  protected async tap(element: ChainablePromiseElement): Promise<void> {
    await element.waitForDisplayed();
    await element.click();
  }

  /** Clears an input and types a value into it. */
  protected async type(element: ChainablePromiseElement, value: string): Promise<void> {
    await element.waitForDisplayed();
    await element.setValue(value);
  }

  /** Scrolls the screen until the element is visible. */
  protected async scrollTo(element: ChainablePromiseElement): Promise<void> {
    if (await element.isDisplayed()) {
      return;
    }
    await element.scrollIntoView({
      direction: 'up',
      maxScrolls: 5,
      scrollableElement: await this.root.getElement(),
    });
  }

  static byId(id: string): string {
    return byA11yId(id);
  }
}

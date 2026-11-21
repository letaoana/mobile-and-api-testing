import { byA11yId } from '../helpers/selectors.ts';

export default abstract class BaseScreen {
  protected constructor(private readonly rootSelector: string) {}

  protected get root() {
    return $(this.rootSelector);
  }

  async waitForIsShown(isShown = true): Promise<void> {
    await this.root.waitForDisplayed({ reverse: !isShown });
  }

  protected async tap(element: ChainablePromiseElement): Promise<void> {
    await element.waitForDisplayed();
    await element.click();
  }

  protected async type(element: ChainablePromiseElement, value: string): Promise<void> {
    await element.waitForDisplayed();
    await element.setValue(value);
  }

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

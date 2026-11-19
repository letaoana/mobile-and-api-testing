import { byA11yId } from '../../helpers/selectors.ts';

export type Tab = 'Home' | 'Webview' | 'Login' | 'Forms' | 'Swipe' | 'Drag';

/** The bottom navigation bar that is visible on every screen. */
class TabBar {
  private tab(name: Tab) {
    return $(byA11yId(name));
  }

  async open(name: Tab): Promise<void> {
    const tab = this.tab(name);
    await tab.waitForDisplayed();
    await tab.click();
  }

  async waitForTabBarShown(): Promise<void> {
    await this.tab('Home').waitForDisplayed({ timeout: 60_000 });
  }
}

export default new TabBar();

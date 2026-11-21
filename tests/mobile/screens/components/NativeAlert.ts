// Android alerts are AppCompat dialogs whose title React Native replaces with `alert_title`.
const androidId = (idPattern: string): string =>
  `android=new UiSelector().resourceIdMatches(".*:id/(${idPattern})$")`;

class NativeAlert {
  private get container() {
    return driver.isAndroid
      ? $(androidId('parentPanel'))
      : $('-ios predicate string:type == "XCUIElementTypeAlert"');
  }

  private get androidTitle() {
    return $(androidId('alert_title|alertTitle'));
  }

  private get androidMessage() {
    return $(androidId('message'));
  }

  private button(label: string) {
    return driver.isAndroid
      ? $(`android=new UiSelector().className("android.widget.Button").text("${label}")`)
      : $(`-ios predicate string:type == "XCUIElementTypeButton" AND label == "${label}"`);
  }

  async waitForIsShown(isShown = true, timeout = 15_000): Promise<void> {
    await this.container.waitForDisplayed({ reverse: !isShown, timeout });
  }

  /** The app shows its result after a 1.5 s simulated request, so wait a little longer than that. */
  async appearsAfterSubmit(): Promise<boolean> {
    try {
      await this.container.waitForDisplayed({ timeout: 3_000 });
      return true;
    } catch {
      return false;
    }
  }

  async getContent(): Promise<{ title: string; message: string }> {
    await this.waitForIsShown();
    if (driver.isAndroid) {
      return {
        title: await this.androidTitle.getText(),
        message: await this.androidMessage.getText(),
      };
    }
    // XCUITest returns "<title>\n<message>" for the alert text.
    const [title = '', ...rest] = (await driver.getAlertText()).split('\n');
    return { title, message: rest.join('\n') };
  }

  async dismissIfShown(): Promise<void> {
    if (await this.container.isDisplayed().catch(() => false)) {
      await this.tapButton('OK').catch(() => driver.back());
    }
  }

  async tapButton(label: string): Promise<void> {
    await this.button(label).click();
    await this.waitForIsShown(false);
  }
}

export default new NativeAlert();

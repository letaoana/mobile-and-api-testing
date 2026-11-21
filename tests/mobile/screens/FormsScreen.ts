import { hideKeyboardIfShown } from '../helpers/keyboard.ts';
import { byA11yId, byText } from '../helpers/selectors.ts';
import BaseScreen from './BaseScreen.ts';

export const DROPDOWN_OPTIONS = [
  'webdriver.io is awesome',
  'Appium is awesome',
  'This app is awesome',
] as const;
export type DropdownOption = (typeof DROPDOWN_OPTIONS)[number];

class FormsScreen extends BaseScreen {
  constructor() {
    super(byA11yId('Forms-screen'));
  }

  private get textInput() {
    return $(byA11yId('text-input'));
  }
  get typedTextResult() {
    return $(byA11yId('input-text-result'));
  }
  private get switchToggle() {
    return $(byA11yId('switch'));
  }
  get switchText() {
    return $(byA11yId('switch-text'));
  }
  private get dropdown() {
    return $(byA11yId('Dropdown'));
  }
  private get activeButton() {
    return $(byA11yId('button-Active'));
  }
  private get dropdownChevron() {
    return $(byA11yId('dropdown-chevron'));
  }
  get inactiveButton() {
    return $(byA11yId('button-Inactive'));
  }

  private get dropdownValue() {
    return driver.isAndroid
      ? this.dropdown.$('android.widget.EditText')
      : this.dropdown.$('-ios predicate string:type == "XCUIElementTypeTextField"');
  }

  async typeText(text: string): Promise<void> {
    await this.type(this.textInput, text);
    await hideKeyboardIfShown();
  }

  async toggleSwitch(): Promise<void> {
    await this.tap(this.switchToggle);
  }

  async waitForSwitchState(on: boolean): Promise<void> {
    await driver.waitUntil(async () => (await this.isSwitchOn()) === on, {
      timeout: 5_000,
      timeoutMsg: `Switch did not turn ${on ? 'on' : 'off'}`,
    });
  }

  async isSwitchOn(): Promise<boolean> {
    // Android exposes the state as `checked`, iOS as `value` ("1"/"0").
    const value = driver.isAndroid
      ? await this.switchToggle.getAttribute('checked')
      : await this.switchToggle.getAttribute('value');
    return value === 'true' || value === '1';
  }

  async selectDropdownOption(option: DropdownOption): Promise<void> {
    if (driver.isAndroid) {
      await this.tap(this.dropdown);
      await this.tap($(byText(option)));
      return;
    }
    // On iOS the picker sheet opens from the chevron icon, not from the field.
    await this.nativeTap(this.dropdownChevron);
    const wheel = $('-ios class chain:**/XCUIElementTypePickerWheel');
    await wheel.waitForDisplayed();
    await wheel.setValue(option);
    await this.closeIosPicker();
  }

  private async closeIosPicker(): Promise<void> {
    await this.nativeTap($(byA11yId('done_button')));
    await $('-ios class chain:**/XCUIElementTypePickerWheel').waitForDisplayed({ reverse: true });
  }

  /** The picker's chevron and Done button ignore XCUITest's element click but take a native tap. */
  private async nativeTap(selector: ChainablePromiseElement): Promise<void> {
    const element = await selector.getElement();
    await element.waitForDisplayed();
    const { width, height } = await element.getSize();
    await driver.execute('mobile: tap', {
      elementId: element.elementId,
      x: Math.round(width / 2),
      y: Math.round(height / 2),
    });
  }

  get selectedDropdownOption() {
    return this.dropdownValue;
  }

  async tapActiveButton(): Promise<void> {
    await this.scrollTo(this.activeButton);
    await this.tap(this.activeButton);
  }
}

export default new FormsScreen();

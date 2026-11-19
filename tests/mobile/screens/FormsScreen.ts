import { hideKeyboardIfShown } from '../helpers/keyboard.ts';
import { byA11yId, byText } from '../helpers/selectors.ts';
import BaseScreen from './BaseScreen.ts';

export const DROPDOWN_OPTIONS = [
  'webdriver.io is awesome',
  'Appium is awesome',
  'This app is awesome',
] as const;
export type DropdownOption = (typeof DROPDOWN_OPTIONS)[number];

/** "Form components" screen: text input, switch, dropdown and buttons. */
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
  get inactiveButton() {
    return $(byA11yId('button-Inactive'));
  }

  /** The text field inside the dropdown that shows the selected option. */
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

  /** Waits until the switch reports the expected state. */
  async waitForSwitchState(on: boolean): Promise<void> {
    await driver.waitUntil(async () => (await this.isSwitchOn()) === on, {
      timeout: 5_000,
      timeoutMsg: `Switch did not turn ${on ? 'on' : 'off'}`,
    });
  }

  async isSwitchOn(): Promise<boolean> {
    // Android reports the state through the `checked` attribute, iOS through `value` ("1"/"0").
    const value = driver.isAndroid
      ? await this.switchToggle.getAttribute('checked')
      : await this.switchToggle.getAttribute('value');
    return value === 'true' || value === '1';
  }

  async selectDropdownOption(option: DropdownOption): Promise<void> {
    if (driver.isAndroid) {
      await this.tap(this.dropdown);
      // Non-native Android picker style opens a dialog with one row per option.
      await this.tap($(byText(option)));
      return;
    }
    // On iOS the wrapper is not accessible, so open the picker through its text field.
    await this.tap(this.dropdownValue);
    const wheel = $('-ios class chain:**/XCUIElementTypePickerWheel');
    await wheel.waitForDisplayed();
    await wheel.setValue(option);
    await this.tap($('~done_button'));
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

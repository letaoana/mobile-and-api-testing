import { relaunchApp } from '../helpers/app.ts';
import FormsScreen, { type DropdownOption } from '../screens/FormsScreen.ts';
import NativeAlert from '../screens/components/NativeAlert.ts';
import TabBar from '../screens/components/TabBar.ts';

describe('Forms', () => {
  beforeEach(async () => {
    await relaunchApp();
    await TabBar.waitForTabBarShown();
    await TabBar.open('Forms');
    await FormsScreen.waitForIsShown();
  });

  afterEach(async () => {
    await NativeAlert.dismissIfShown();
  });

  it('fills in every field, submits the form and shows the result', async () => {
    const text = 'Hello from the test suite';
    const option: DropdownOption = 'Appium is awesome';

    await FormsScreen.typeText(text);
    await expect(FormsScreen.typedTextResult).toHaveText(text);

    expect(await FormsScreen.isSwitchOn()).toBe(false);
    await FormsScreen.toggleSwitch();
    await FormsScreen.waitForSwitchState(true);
    await expect(FormsScreen.switchText).toHaveText('Click to turn the switch OFF');

    await FormsScreen.selectDropdownOption(option);
    await expect(FormsScreen.selectedDropdownOption).toHaveText(option);

    await FormsScreen.tapActiveButton();
    expect(await NativeAlert.getContent()).toEqual({
      title: 'This button is',
      message: 'This button is active',
    });
    await NativeAlert.tapButton('OK');

    // The submitted values are kept after the dialog is closed.
    await expect(FormsScreen.typedTextResult).toHaveText(text);
    await expect(FormsScreen.selectedDropdownOption).toHaveText(option);
  });

  it('turns the switch back off on a second tap', async () => {
    await FormsScreen.toggleSwitch();
    await FormsScreen.waitForSwitchState(true);
    await FormsScreen.toggleSwitch();

    await FormsScreen.waitForSwitchState(false);
    await expect(FormsScreen.switchText).toHaveText('Click to turn the switch ON');
  });
});

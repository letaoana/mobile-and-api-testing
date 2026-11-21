import { hideKeyboardIfShown } from '../helpers/keyboard.ts';
import { byA11yId, byText } from '../helpers/selectors.ts';
import BaseScreen from './BaseScreen.ts';

export interface Credentials {
  email: string;
  password: string;
}

export const LOGIN_ERRORS = {
  invalidEmail: 'Please enter a valid email address',
  invalidPassword: 'Please enter at least 8 characters',
  passwordMismatch: 'Please enter the same password',
} as const;

class LoginScreen extends BaseScreen {
  constructor() {
    super(byA11yId('Login-screen'));
  }

  private get loginTab() {
    return $(byA11yId('button-login-container'));
  }
  private get signUpTab() {
    return $(byA11yId('button-sign-up-container'));
  }
  private get emailInput() {
    return $(byA11yId('input-email'));
  }
  private get passwordInput() {
    return $(byA11yId('input-password'));
  }
  private get repeatPasswordInput() {
    return $(byA11yId('input-repeat-password'));
  }
  private get loginButton() {
    return $(byA11yId('button-LOGIN'));
  }
  private get signUpButton() {
    return $(byA11yId('button-SIGN UP'));
  }

  async login({ email, password }: Credentials): Promise<void> {
    await this.tap(this.loginTab);
    await this.repeatPasswordInput.waitForExist({ reverse: true });
    await this.type(this.emailInput, email);
    await this.typePassword(this.passwordInput, password);
    await this.submit(this.loginButton);
  }

  async signUp({ email, password }: Credentials, repeatPassword = password): Promise<void> {
    await this.tap(this.signUpTab);
    await this.repeatPasswordInput.waitForDisplayed();
    await this.type(this.emailInput, email);
    await this.typePassword(this.passwordInput, password);
    await this.typePassword(this.repeatPasswordInput, repeatPassword);
    // Closing iOS's password suggestion on the second field can clear the first one.
    await this.retypeIfCleared(this.passwordInput, password);
    await this.submit(this.signUpButton);
  }

  validationError(message: string) {
    return $(byText(message));
  }

  /**
   * iOS can show a "Use Strong Password?" sheet that swallows typing into secure fields, and
   * simulators differ in how keystrokes arrive, so each attempt is verified before moving on.
   */
  private async typePassword(input: ChainablePromiseElement, value: string): Promise<void> {
    if (driver.isAndroid) {
      await this.type(input, value);
      return;
    }
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (attempt === 1) {
        await this.type(input, value);
      } else {
        await this.tap(input);
        await this.closeStrongPasswordSheetIfShown();
        await input.clearValue();
        // Typing without tapping the field again avoids reopening the sheet.
        await driver.execute('mobile: keys', { keys: [...value] });
      }
      await this.closeStrongPasswordSheetIfShown();
      if (await this.holdsPassword(input, value)) {
        return;
      }
    }
    throw new Error(`Could not type the password into ${await input.selector}`);
  }

  /** iOS shows a secure field's value as one bullet per character. */
  private async holdsPassword(input: ChainablePromiseElement, value: string): Promise<boolean> {
    return ((await input.getAttribute('value')) ?? '') === '\u2022'.repeat(value.length);
  }

  private async retypeIfCleared(input: ChainablePromiseElement, value: string): Promise<void> {
    if (driver.isIOS && !(await this.holdsPassword(input, value))) {
      await this.typePassword(input, value);
    }
  }

  private async closeStrongPasswordSheetIfShown(): Promise<void> {
    if (await this.strongPasswordSheet.isDisplayed().catch(() => false)) {
      await this.tap(this.closeStrongPasswordSheet);
      await this.strongPasswordSheet.waitForDisplayed({ reverse: true });
    }
  }

  private get strongPasswordSheet() {
    return $(byA11yId('GenerateStrongPasswordButton'));
  }
  private get closeStrongPasswordSheet() {
    return $(byA11yId('xmark'));
  }

  private async submit(button: ChainablePromiseElement): Promise<void> {
    await hideKeyboardIfShown();
    await this.scrollTo(button);
    await this.tap(button);
  }
}

export default new LoginScreen();

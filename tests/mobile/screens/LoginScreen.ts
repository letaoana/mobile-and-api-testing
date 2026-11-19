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

/** Login / Sign up screen. Both forms share the same email and password inputs. */
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
    await this.submit(this.signUpButton);
  }

  /** Returns the validation error element for the given message. */
  validationError(message: string) {
    return $(byText(message));
  }

  /**
   * iOS offers a "Use Strong Password?" AutoFill sheet when a password field gets focus,
   * which swallows the typed characters. Focus the field, close the sheet if it shows,
   * then type into the focused field.
   */
  private async typePassword(input: ChainablePromiseElement, value: string): Promise<void> {
    if (driver.isAndroid) {
      await this.type(input, value);
      return;
    }
    await this.tap(input);
    if (await this.strongPasswordSheet.isDisplayed().catch(() => false)) {
      await this.tap(this.closeStrongPasswordSheet);
      await this.strongPasswordSheet.waitForDisplayed({ reverse: true });
      await this.tap(input);
    }
    await input.clearValue();
    // Type into the focused field without tapping it again (which would reopen the sheet).
    await driver.execute('mobile: keys', { keys: [...value] });
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

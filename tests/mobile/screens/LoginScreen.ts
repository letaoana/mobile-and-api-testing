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
  private get formTitle() {
    return $(byText('Login / Sign up Form'));
  }

  async login({ email, password }: Credentials): Promise<void> {
    await this.tap(this.loginTab);
    await this.repeatPasswordInput.waitForExist({ reverse: true });
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.submit(this.loginButton);
  }

  async signUp({ email, password }: Credentials, repeatPassword = password): Promise<void> {
    await this.tap(this.signUpTab);
    await this.repeatPasswordInput.waitForDisplayed();
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.type(this.repeatPasswordInput, repeatPassword);
    await this.submit(this.signUpButton);
  }

  /** Returns the validation error element for the given message. */
  validationError(message: string) {
    return $(byText(message));
  }

  private async submit(button: ChainablePromiseElement): Promise<void> {
    await hideKeyboardIfShown(await this.formTitle.getElement());
    await this.scrollTo(button);
    await this.tap(button);
  }
}

export default new LoginScreen();

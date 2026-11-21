import { newUser } from '../data/users.ts';
import { relaunchApp } from '../helpers/app.ts';
import LoginScreen, { LOGIN_ERRORS } from '../screens/LoginScreen.ts';
import NativeAlert from '../screens/components/NativeAlert.ts';
import TabBar from '../screens/components/TabBar.ts';

describe('Sign up', () => {
  beforeEach(async () => {
    await relaunchApp();
    await TabBar.waitForTabBarShown();
    await TabBar.open('Login');
    await LoginScreen.waitForIsShown();
  });

  afterEach(async () => {
    await NativeAlert.dismissIfShown();
  });

  it('creates a new account with a valid email and matching passwords', async () => {
    await LoginScreen.signUp(newUser());

    expect(await NativeAlert.getContent()).toEqual({
      title: 'Signed Up!',
      message: 'You successfully signed up!',
    });
    await NativeAlert.tapButton('OK');
  });

  it('rejects the sign up when the passwords do not match', async () => {
    const user = newUser();

    await LoginScreen.signUp(user, `${user.password}-different`);

    await expect(LoginScreen.validationError(LOGIN_ERRORS.passwordMismatch)).toBeDisplayed();
    expect(await NativeAlert.appearsAfterSubmit()).toBe(false);
  });
});

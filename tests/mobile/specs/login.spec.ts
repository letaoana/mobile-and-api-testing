import { newUser, WRONG_PASSWORD } from '../data/users.ts';
import { relaunchApp } from '../helpers/app.ts';
import LoginScreen, { LOGIN_ERRORS } from '../screens/LoginScreen.ts';
import NativeAlert from '../screens/components/NativeAlert.ts';
import TabBar from '../screens/components/TabBar.ts';

describe('Login', () => {
  const user = newUser();

  before(async () => {
    // Register the account first so the login uses credentials that were signed up.
    await TabBar.waitForTabBarShown();
    await TabBar.open('Login');
    await LoginScreen.signUp(user);
    await NativeAlert.tapButton('OK');
  });

  beforeEach(async () => {
    await relaunchApp();
    await TabBar.waitForTabBarShown();
    await TabBar.open('Login');
    await LoginScreen.waitForIsShown();
  });

  afterEach(async () => {
    await NativeAlert.dismissIfShown();
  });

  it('logs in with valid credentials', async () => {
    await LoginScreen.login(user);

    expect(await NativeAlert.getContent()).toEqual({
      title: 'Success',
      message: 'You are logged in!',
    });
    await NativeAlert.tapButton('OK');
  });

  it('shows an error message when the password is wrong', async () => {
    await LoginScreen.login({ ...user, password: WRONG_PASSWORD });

    await expect(LoginScreen.validationError(LOGIN_ERRORS.invalidPassword)).toBeDisplayed();
    // The app shows its result alert after a 1.5 s simulated request, so wait longer than that.
    expect(await NativeAlert.appearsWithin(3_000)).toBe(false);
  });

  it('shows an error message when the email address is invalid', async () => {
    await LoginScreen.login({ ...user, email: 'not-an-email' });

    await expect(LoginScreen.validationError(LOGIN_ERRORS.invalidEmail)).toBeDisplayed();
    // The app shows its result alert after a 1.5 s simulated request, so wait longer than that.
    expect(await NativeAlert.appearsWithin(3_000)).toBe(false);
  });
});

import { relaunchApp } from '../helpers/app.ts';
import DragScreen from '../screens/DragScreen.ts';
import TabBar from '../screens/components/TabBar.ts';

describe('Drag and drop', () => {
  beforeEach(async () => {
    await relaunchApp();
    await TabBar.waitForTabBarShown();
    await TabBar.open('Drag');
    await DragScreen.waitForIsShown();
  });

  it('completes the puzzle and can start over', async () => {
    await DragScreen.completePuzzle();

    await expect(DragScreen.successTitle).toBeDisplayed();

    await DragScreen.retry();

    await expect(DragScreen.successTitle).not.toBeDisplayed();
    await expect(DragScreen.piece('l1')).toBeDisplayed();
  });
});

import SwipeScreen, { CAROUSEL_SLIDES } from '../screens/SwipeScreen.ts';
import TabBar from '../screens/components/TabBar.ts';

describe('Swipe', () => {
  beforeEach(async () => {
    await TabBar.waitForTabBarShown();
    await TabBar.open('Swipe');
    await SwipeScreen.waitForIsShown();
  });

  it('moves the carousel to the next and previous slide', async () => {
    expect(await SwipeScreen.getVisibleSlideTitle()).toBe(CAROUSEL_SLIDES[0]);

    await SwipeScreen.swipeCarousel('left');
    expect(await SwipeScreen.getVisibleSlideTitle()).toBe(CAROUSEL_SLIDES[1]);

    await SwipeScreen.swipeCarousel('left');
    expect(await SwipeScreen.getVisibleSlideTitle()).toBe(CAROUSEL_SLIDES[2]);

    await SwipeScreen.swipeCarousel('right');
    expect(await SwipeScreen.getVisibleSlideTitle()).toBe(CAROUSEL_SLIDES[1]);
  });

  it('reveals the hidden content after scrolling down', async () => {
    await expect(SwipeScreen.hiddenLogo).not.toBeDisplayed();

    await SwipeScreen.scrollToHiddenLogo();

    await expect(SwipeScreen.hiddenLogo).toBeDisplayed();
    await expect(SwipeScreen.hiddenMessage).toBeDisplayed();
  });
});

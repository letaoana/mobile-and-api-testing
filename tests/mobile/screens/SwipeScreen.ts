import { byA11yId, byText } from '../helpers/selectors.ts';
import { distanceFromScreenCentreX, isInViewport } from '../helpers/viewport.ts';
import BaseScreen from './BaseScreen.ts';

export const CAROUSEL_SLIDES = [
  'FULLY OPEN SOURCE',
  'GREAT COMMUNITY',
  'JS.FOUNDATION',
  'SUPPORT VIDEOS',
  'EXTENDABLE',
  'COMPATIBLE',
] as const;

class SwipeScreen extends BaseScreen {
  constructor() {
    super(byA11yId('Swipe-screen'));
  }

  private get carousel() {
    return driver.isAndroid
      ? $('android=new UiSelector().resourceId("Carousel")')
      : $(byA11yId('Carousel'));
  }
  get hiddenLogo() {
    return $(byA11yId('WebdriverIO logo'));
  }
  get hiddenMessage() {
    return $(byText('You found me!!!'));
  }

  private slideTitle(title: string) {
    return $(byText(title));
  }

  async getVisibleSlideTitle(): Promise<string | undefined> {
    let closest: { title: string; distance: number } | undefined;
    for (const title of CAROUSEL_SLIDES) {
      const distance = await distanceFromScreenCentreX(await this.slideTitle(title).getElement());
      if (distance !== undefined && (!closest || distance < closest.distance)) {
        closest = { title, distance };
      }
    }
    return closest?.title;
  }

  async isHiddenLogoInViewport(): Promise<boolean> {
    return isInViewport(await this.hiddenLogo.getElement());
  }

  async swipeCarousel(direction: 'left' | 'right'): Promise<void> {
    const before = await this.getVisibleSlideTitle();
    const carousel = await this.carousel.getElement();
    if (driver.isAndroid) {
      // The carousel's gesture handler ignores synthesised W3C swipes on Android.
      await driver.execute('mobile: swipeGesture', {
        elementId: carousel.elementId,
        direction,
        percent: 0.75,
      });
    } else {
      await driver.swipe({ direction, scrollableElement: carousel, percent: 0.8, duration: 600 });
    }
    await driver.waitUntil(async () => (await this.getVisibleSlideTitle()) !== before, {
      timeoutMsg: `Carousel did not move ${direction} from "${before}"`,
    });
  }

  async scrollToHiddenLogo(): Promise<void> {
    await this.hiddenMessage.scrollIntoView({
      direction: 'up',
      maxScrolls: 10,
      scrollableElement: await this.root.getElement(),
    });
  }
}

export default new SwipeScreen();

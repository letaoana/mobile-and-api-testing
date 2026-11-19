import { byA11yId, byText } from '../helpers/selectors.ts';
import { isHorizontallyInViewport } from '../helpers/viewport.ts';
import BaseScreen from './BaseScreen.ts';

/** Carousel slides, in the order the app renders them. Titles are upper-cased by the app. */
export const CAROUSEL_SLIDES = [
  'FULLY OPEN SOURCE',
  'GREAT COMMUNITY',
  'JS.FOUNDATION',
  'SUPPORT VIDEOS',
  'EXTENDABLE',
  'COMPATIBLE',
] as const;

/** Swipe screen: a horizontal carousel plus hidden content further down the page. */
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

  /** Returns the title of the slide currently centred on screen. */
  async getVisibleSlideTitle(): Promise<string | undefined> {
    for (const title of CAROUSEL_SLIDES) {
      if (await isHorizontallyInViewport(await this.slideTitle(title).getElement())) {
        return title;
      }
    }
    return undefined;
  }

  async swipeCarousel(direction: 'left' | 'right'): Promise<void> {
    const before = await this.getVisibleSlideTitle();
    await driver.swipe({
      direction,
      scrollableElement: await this.carousel.getElement(),
      percent: 0.8,
      duration: 600,
    });
    // Wait until the carousel has settled on a different slide.
    await driver.waitUntil(async () => (await this.getVisibleSlideTitle()) !== before, {
      timeoutMsg: `Carousel did not move ${direction} from "${before}"`,
    });
  }

  /** Swipes up the page until the hidden logo is visible. */
  async scrollToHiddenLogo(): Promise<void> {
    await this.hiddenLogo.scrollIntoView({
      direction: 'up',
      maxScrolls: 10,
      scrollableElement: await this.root.getElement(),
    });
  }
}

export default new SwipeScreen();

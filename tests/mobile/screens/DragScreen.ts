import { byA11yId, byText } from '../helpers/selectors.ts';
import BaseScreen from './BaseScreen.ts';

export const PUZZLE_PIECES = ['l1', 'c1', 'r1', 'l2', 'c2', 'r2', 'l3', 'c3', 'r3'] as const;
export type PuzzlePiece = (typeof PUZZLE_PIECES)[number];

class DragScreen extends BaseScreen {
  constructor() {
    super(byA11yId('Drag-drop-screen'));
  }

  piece(id: PuzzlePiece) {
    return $(byA11yId(`drag-${id}`));
  }
  private dropZone(id: PuzzlePiece) {
    return $(byA11yId(`drop-${id}`));
  }
  get successTitle() {
    return $(byText('Congratulations'));
  }
  get retryButton() {
    return $(byA11yId('button-Retry'));
  }

  async dragPieceToItsZone(id: PuzzlePiece): Promise<void> {
    const piece = this.piece(id);
    await piece.waitForDisplayed();
    await piece.dragAndDrop(await this.dropZone(id).getElement(), { duration: 600 });
  }

  async completePuzzle(): Promise<void> {
    for (const id of PUZZLE_PIECES) {
      await this.dragPieceToItsZone(id);
    }
  }

  async retry(): Promise<void> {
    await this.tap(this.retryButton);
  }
}

export default new DragScreen();

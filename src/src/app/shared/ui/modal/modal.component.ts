import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

let modalCounter = 0;

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly open = input<boolean>(false);
  readonly maxWidth = input<number>(500);
  // Permite desactivar el cierre al pulsar fuera del modal (clic en el fondo)
  readonly closeOnBackdrop = input<boolean>(true);
  readonly close = output<void>();

  readonly maxWidthPx = computed(() => this.maxWidth());
  readonly titleId = `modal-title-${++modalCounter}`;

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect(() => {
      if (this.open()) {
        queueMicrotask(() => this.panel()?.nativeElement.focus());
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.closeOnBackdrop()) return;
    if (event.target === event.currentTarget) this.close.emit();
  }

  onEscape(): void {
    if (this.open()) this.close.emit();
  }
}

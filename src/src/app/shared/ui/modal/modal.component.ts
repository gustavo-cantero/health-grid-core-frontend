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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="modal-bg"
        (click)="onBackdropClick($event)"
        (keydown.escape)="close.emit()"
      >
        <div
          #panel
          class="modal"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          tabindex="-1"
          [style.max-width.px]="maxWidthPx()"
        >
          <div class="modal-header">
            <h3 [id]="titleId">{{ title() }}</h3>
            <button
              type="button"
              class="close-btn"
              [attr.aria-label]="'Cerrar ' + title()"
              (click)="close.emit()"
            >×</button>
          </div>
          <ng-content />
        </div>
      </div>
    }
  `,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly open = input<boolean>(false);
  readonly maxWidth = input<number>(500);
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
    if (event.target === event.currentTarget) this.close.emit();
  }

  onEscape(): void {
    if (this.open()) this.close.emit();
  }
}

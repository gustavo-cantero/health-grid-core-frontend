import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export interface ChipOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-chips-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-group">
      <label [attr.for]="listId">{{ assignedLabel() }}</label>
      <div class="chips" [id]="listId">
        @if (assigned().length === 0) {
          <span style="color:#aaa;font-size:12px">— Ninguno asignado</span>
        }
        @for (chip of assigned(); track chip.id) {
          <span class="chip">
            <span>{{ chip.label }}</span>
            <button
              type="button"
              class="chip-remove"
              [attr.aria-label]="'Quitar ' + chip.label"
              (click)="remove.emit(chip.id)"
            >×</button>
          </span>
        }
      </div>
    </div>

    <div class="form-group" style="margin-top:14px">
      <label [attr.for]="selectId">{{ addLabel() }}</label>
      <div style="display:flex;gap:8px">
        <select
          [id]="selectId"
          [value]="selected()"
          (change)="onSelect($event)"
          style="flex:1"
        >
          <option value="">{{ placeholder() }}</option>
          @for (opt of available(); track opt.id) {
            <option [value]="opt.id">{{ opt.label }}</option>
          }
        </select>
        <button
          type="button"
          class="btn-main"
          [disabled]="selected() === ''"
          (click)="onAdd()"
        >Asignar</button>
      </div>
    </div>
  `,
})
export class ChipsInputComponent {
  readonly assigned = input.required<ChipOption[]>();
  readonly available = input.required<ChipOption[]>();
  readonly assignedLabel = input<string>('Asignados');
  readonly addLabel = input<string>('Agregar');
  readonly placeholder = input<string>('Seleccioná un valor...');

  readonly add = output<number>();
  readonly remove = output<number>();

  protected readonly selected = signal<string>('');

  private static nextId = 0;
  private readonly uid = ++ChipsInputComponent.nextId;
  protected readonly listId = `chips-list-${this.uid}`;
  protected readonly selectId = `chips-select-${this.uid}`;

  onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selected.set(value);
  }

  onAdd(): void {
    const value = this.selected();
    if (!value) return;
    this.add.emit(Number(value));
    this.selected.set('');
  }
}

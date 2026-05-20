import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export interface ChipOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-chips-input',
  templateUrl: './chips-input.component.html',
  styleUrls: ['./chips-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

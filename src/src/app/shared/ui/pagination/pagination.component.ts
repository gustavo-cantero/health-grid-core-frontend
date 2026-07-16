import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

// A partir de esta cantidad de páginas se recorta el listado con elipsis.
const MAX_VISIBLE = 7;

type PageItem = { kind: 'page'; n: number } | { kind: 'gap' };

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  // Deja siempre visibles la primera, la última, la actual y sus vecinas;
  // los tramos intermedios se colapsan en «…» para que la fila no desborde.
  protected readonly items = computed<PageItem[]>(() => {
    const total = this.totalPages();
    const current = this.page();

    if (total <= MAX_VISIBLE) {
      return Array.from({ length: total }, (_, i) => ({ kind: 'page', n: i + 1 }) as PageItem);
    }

    const items: PageItem[] = [{ kind: 'page', n: 1 }];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) items.push({ kind: 'gap' });
    for (let n = start; n <= end; n++) items.push({ kind: 'page', n });
    if (end < total - 1) items.push({ kind: 'gap' });
    items.push({ kind: 'page', n: total });

    return items;
  });

  protected goTo(n: number): void {
    if (n !== this.page()) this.pageChange.emit(n);
  }

  protected prev(): void {
    if (this.page() > 1) this.pageChange.emit(this.page() - 1);
  }

  protected next(): void {
    if (this.page() < this.totalPages()) this.pageChange.emit(this.page() + 1);
  }
}

import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'info' | 'warning';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _message = signal<string | null>(null);
  readonly message = this._message.asReadonly();

  private readonly _variant = signal<ToastVariant>('info');
  readonly variant = this._variant.asReadonly();

  private timerId: ReturnType<typeof setTimeout> | null = null;
  // Mientras un aviso prioritario esté visible ignoramos los toasts normales
  // para que un mensaje de éxito no tape la advertencia.
  private priorityUntil = 0;

  show(message: string, durationMs = 2600): void {
    if (Date.now() < this.priorityUntil) return;
    this.set(message, 'info', durationMs, false);
  }

  showWarning(message: string, durationMs = 5000): void {
    this.set(message, 'warning', durationMs, true);
  }

  clear(): void {
    if (this.timerId !== null) clearTimeout(this.timerId);
    this.priorityUntil = 0;
    this._message.set(null);
  }

  private set(message: string, variant: ToastVariant, durationMs: number, priority: boolean): void {
    this._message.set(message);
    this._variant.set(variant);
    if (this.timerId !== null) clearTimeout(this.timerId);
    this.priorityUntil = priority ? Date.now() + durationMs : 0;
    this.timerId = setTimeout(() => {
      this._message.set(null);
      this.priorityUntil = 0;
    }, durationMs);
  }
}

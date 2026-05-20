import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _message = signal<string | null>(null);
  readonly message = this._message.asReadonly();

  private timerId: ReturnType<typeof setTimeout> | null = null;

  show(message: string, durationMs = 2600): void {
    this._message.set(message);
    if (this.timerId !== null) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => this._message.set(null), durationMs);
  }

  clear(): void {
    if (this.timerId !== null) clearTimeout(this.timerId);
    this._message.set(null);
  }
}

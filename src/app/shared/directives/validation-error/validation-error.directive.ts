import {
  Directive,
  ElementRef,
  inject,
  input,
  effect,
  Renderer2,
  OnInit,
  DestroyRef,
  signal,
  computed
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegexPatterns } from "../../constants/regex.constants";

@Directive({
  selector: '[appValidationError]',
  standalone: true
})
export class ValidationErrorDirective implements OnInit {
  appValidationError = input<boolean>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private readonly el = inject(ElementRef);
  private readonly ngControl = inject(NgControl);

  private errorElement: HTMLDivElement | null = null;
  private readonly controlErrors = signal<Record<string, any> | null>(null);

  private readonly errorMessages = computed(() => {
    const errors = this.controlErrors();
    if (!errors) return [];
    return this.getErrorMessages(errors);
  });

  ngOnInit() {
    // Handle real-time validation updates
    this.ngControl.control?.valueChanges?.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (this.appValidationError()) {
        this.updateErrors();
      }
    });

    this.ngControl.control?.statusChanges?.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (this.appValidationError()) {
        this.updateErrors();
      }
    });
  }

  constructor() {
    // Handle submission state changes
    effect(() => {
      if (this.appValidationError()) {
        this.ngControl.control?.markAsTouched();
        this.updateErrors();
      } else {
        this.removeErrors();
      }
    });
  }

  private updateErrors(): void {
    this.controlErrors.set(this.ngControl.control?.errors || null);

    if (this.errorMessages().length > 0) {
      this.showErrors(this.errorMessages());
    } else {
      this.removeErrors();
    }
  }

  private showErrors(messages: string[]): void {
    this.removeErrors();

    if (messages.length > 0) {
      this.errorElement = this.renderer.createElement('div');
      this.renderer.addClass(this.errorElement, 'validation-error');

      messages.forEach(message => {
        const messageElement = this.renderer.createElement('p');
        this.renderer.addClass(messageElement, 'error-message');
        this.renderer.setProperty(messageElement, 'textContent', message);
        this.renderer.appendChild(this.errorElement, messageElement);
      });

      const parent = this.el.nativeElement.parentNode;
      if (parent) {
        this.renderer.appendChild(parent, this.errorElement);
      }
    }
  }

  private removeErrors(): void {
    if (this.errorElement?.parentNode) {
      this.renderer.removeChild(this.errorElement.parentNode, this.errorElement);
      this.errorElement = null;
    }
  }

  private getErrorMessages(errors: Record<string, any>): string[] {
    const messages: string[] = [];

    if (errors['required']) {
      messages.push('Šis lauks ir obligāts');
    }
    if (errors['email']) {
      messages.push('Lūdzu, ievadiet derīgu e-pasta adresi');
    }
    if (errors['pattern']) {
      const fieldName = this.ngControl.name as keyof typeof RegexPatterns.ERROR_MESSAGES;
      if (fieldName && RegexPatterns.ERROR_MESSAGES[fieldName]) {
        messages.push(RegexPatterns.ERROR_MESSAGES[fieldName]);
      }
    }
    if (errors['minlength']) {
      messages.push(`Minimālais garums ir ${errors['minlength'].requiredLength} rakstzīmes`);
    }
    if (errors['maxlength']) {
      messages.push(`Maximālais garums ir ${errors['maxlength'].requiredLength} rakstzīmes`);
    }
    if (errors['passwordMismatch']) {
      messages.push('Paroles nesakrīt');
    }

    return messages;
  }
}

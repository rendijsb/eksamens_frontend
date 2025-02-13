import { Directive, ElementRef, input, effect, inject, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appButtonLoader]',
  standalone: true
})
export class ButtonLoaderDirective {
  appButtonLoader = input<boolean>(false);
  private spinner: HTMLDivElement | null = null;
  private readonly renderer = inject(Renderer2);
  private readonly el = inject(ElementRef);

  constructor() {
    this.renderer.addClass(this.el.nativeElement, 'button-loader');

    effect(() => {
      if (this.appButtonLoader()) {
        if (!this.spinner) {
          this.spinner = this.renderer.createElement('div');
          this.renderer.addClass(this.spinner, 'spinner');
          this.renderer.insertBefore(this.el.nativeElement, this.spinner, this.el.nativeElement.firstChild);
        }
        this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
      } else {
        if (this.spinner && this.spinner.parentNode) {
          this.renderer.removeChild(this.spinner.parentNode, this.spinner);
          this.spinner = null;
        }
        this.renderer.setProperty(this.el.nativeElement, 'disabled', false);
      }
    });
  }
}

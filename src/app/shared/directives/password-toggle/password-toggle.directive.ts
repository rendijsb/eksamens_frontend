import { Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appPasswordToggle]',
  standalone: true
})
export class PasswordToggleDirective {
  private isVisible = false;
  private toggleIcon: HTMLElement;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    const wrapper = this.renderer.createElement('div');
    this.renderer.addClass(wrapper, 'input-wrapper');
    this.renderer.setStyle(wrapper, 'position', 'relative');

    const parent = this.el.nativeElement.parentElement;
    this.renderer.insertBefore(parent, wrapper, this.el.nativeElement);

    this.renderer.appendChild(wrapper, this.el.nativeElement);

    this.toggleIcon = this.renderer.createElement('span');
    this.renderer.addClass(this.toggleIcon, 'password-toggle-icon');

    const iconElement = this.renderer.createElement('i');
    this.renderer.addClass(iconElement, 'fas');
    this.renderer.addClass(iconElement, 'fa-eye-slash');
    this.renderer.appendChild(this.toggleIcon, iconElement);

    this.renderer.appendChild(wrapper, this.toggleIcon);

    this.toggleIcon.addEventListener('click', () => this.toggleVisibility());
  }

  private toggleVisibility() {
    this.isVisible = !this.isVisible;

    this.renderer.setAttribute(
      this.el.nativeElement,
      'type',
      this.isVisible ? 'text' : 'password'
    );

    const iconElement = this.toggleIcon.querySelector('i');
    if (iconElement) {
      this.renderer.removeClass(iconElement, this.isVisible ? 'fa-eye-slash' : 'fa-eye');
      this.renderer.addClass(iconElement, this.isVisible ? 'fa-eye' : 'fa-eye-slash');
    }
  }
}

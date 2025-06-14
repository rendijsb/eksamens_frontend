import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RegexPatterns } from '../../../shared/constants/regex.constants';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import { ValidationErrorDirective } from '../../../shared/directives/validation-error/validation-error.directive';
import {Contact, ContactFormData, PagesService} from "../service/page.service";

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonLoaderDirective,
    ValidationErrorDirective
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  private readonly pagesService = inject(PagesService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly contactInfo = signal<Contact | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSending = signal(false);
  protected readonly isSubmitted = signal(false);
  protected readonly safeMapEmbedCode = signal<SafeHtml | null>(null);

  contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(RegexPatterns.NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.pattern(RegexPatterns.EMAIL_PATTERN)]],
    subject: ['', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(20)]]
  });

  ngOnInit(): void {
    this.loadContactInfo();
  }

  loadContactInfo(): void {
    this.isLoading.set(true);

    this.pagesService.getContactInfo()
      .pipe(
        tap((response) => {
          this.contactInfo.set(response.data);
          if (response.data.map_embed_code) {
            const trustedHtml = this.sanitizer.bypassSecurityTrustHtml(response.data.map_embed_code);
            this.safeMapEmbedCode.set(trustedHtml);
          } else {
            this.safeMapEmbedCode.set(null);
          }
        }),
        catchError(() => {
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  submitForm(): void {
    this.isSubmitted.set(true);

    if (this.contactForm.invalid) {
      return;
    }

    this.isSending.set(true);

    const formData: ContactFormData = {
      name: this.contactForm.value.name!,
      email: this.contactForm.value.email!,
      subject: this.contactForm.value.subject!,
      message: this.contactForm.value.message!
    };

    this.pagesService.sendContactForm(formData)
      .pipe(
        tap((response) => {
          this.toastr.success(response.message);
          this.contactForm.reset();
          this.isSubmitted.set(false);
        }),
        catchError((error) => {
          this.toastr.error('Neizdevās nosūtīt ziņojumu');
          return EMPTY;
        }),
        finalize(() => {
          this.isSending.set(false);
        })
      )
      .subscribe();
  }
}

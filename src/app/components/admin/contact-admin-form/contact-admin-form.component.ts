import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {RegexPatterns} from "../../../shared/constants/regex.constants";
import {Contact, PagesService} from "../../main/service/page.service";
import {ValidationErrorDirective} from "../../../shared/directives/validation-error/validation-error.directive";
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";

@Component({
  selector: 'app-contact-admin-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ValidationErrorDirective,
    ButtonLoaderDirective
  ],
  templateUrl: './contact-admin-form.component.html',
  styleUrls: ['../styles/admin-page-styles.scss']
})
export class ContactAdminFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pagesService = inject(PagesService);
  private readonly toastr = inject(ToastrService);

  protected readonly isLoading = signal(false);
  protected readonly isSubmitted = signal(false);
  protected readonly contactInfo = signal<Contact | null>(null);

  contactForm = this.fb.group({
    address: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.pattern(RegexPatterns.EMAIL_PATTERN)]],
    phone: ['', [Validators.required, Validators.pattern(RegexPatterns.PHONE_PATTERN)]],
    working_hours: [''],
    map_embed_code: [''],
    additional_info: ['']
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
          this.contactForm.patchValue({
            address: response.data.address,
            email: response.data.email,
            phone: response.data.phone,
            working_hours: response.data.working_hours,
            map_embed_code: response.data.map_embed_code,
            additional_info: response.data.additional_info
          });
        }),
        catchError(() => {
          this.toastr.info('Kontaktinformācija vēl nav iestatīta');
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

    this.isLoading.set(true);

    const formData = this.contactForm.value as Partial<Contact>;

    this.pagesService.updateContactInfo(formData)
      .pipe(
        tap(() => {
          this.toastr.success('Kontaktinformācija veiksmīgi atjaunināta');
          this.loadContactInfo();
        }),
        catchError(() => {
          this.toastr.error('Neizdevās atjaunināt kontaktinformāciju');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
          this.isSubmitted.set(false);
        })
      )
      .subscribe();
  }
}

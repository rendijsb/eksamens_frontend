import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../shared/services/notification.service';
import { NotificationPreferences } from '../../../shared/models/notification.models';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import { AuthService } from '../../auth/services/auth.service';
import { RoleEnum } from '../../auth/models/user.models';

@Component({
  selector: 'app-notification-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonLoaderDirective
  ],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss'
})
export class NotificationSettingsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isSaving: WritableSignal<boolean> = signal(false);
  protected readonly preferences: WritableSignal<NotificationPreferences | null> = signal(null);

  preferencesForm: FormGroup = this.fb.group({
    order_status_updates: [true],
    promotional_emails: [true],
    newsletter_emails: [true],
    security_alerts: [true],
    product_recommendations: [true],
    inventory_alerts: [false],
    price_drop_alerts: [false],
    review_reminders: [true],
    email_notifications: [true],
    sms_notifications: [false]
  });

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.isLoading.set(true);

    this.notificationService.getNotificationPreferences()
      .pipe(
        tap(response => {
          this.preferences.set(response.data);
          this.updateFormValues(response.data);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt paziņojumu iestatījumus');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  updateFormValues(preferences: NotificationPreferences): void {
    this.preferencesForm.patchValue({
      order_status_updates: preferences.order_status_updates,
      promotional_emails: preferences.promotional_emails,
      newsletter_emails: preferences.newsletter_emails,
      security_alerts: preferences.security_alerts,
      product_recommendations: preferences.product_recommendations,
      inventory_alerts: preferences.inventory_alerts,
      price_drop_alerts: preferences.price_drop_alerts,
      review_reminders: preferences.review_reminders,
      email_notifications: preferences.email_notifications,
      sms_notifications: preferences.sms_notifications
    });
  }

  resetForm(): void {
    if (this.preferences()) {
      this.updateFormValues(this.preferences()!);
    }
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    const formData = this.preferencesForm.value;

    this.notificationService.updateNotificationPreferences(formData)
      .pipe(
        tap(response => {
          this.preferences.set(response.data);
          this.toastr.success('Paziņojumu iestatījumi veiksmīgi saglabāti');
        }),
        catchError(error => {
          if (error.status === 422 && error.error?.errors) {
            this.toastr.error('Lūdzu, pārbaudiet ievadītos datus');
          } else {
            this.toastr.error('Neizdevās saglabāt paziņojumu iestatījumus');
          }
          return EMPTY;
        }),
        finalize(() => {
          this.isSaving.set(false);
        })
      )
      .subscribe();
  }

  isAdminOrModerator(): boolean {
    const user = this.authService.user();
    return user?.role === RoleEnum.ADMIN || user?.role === RoleEnum.MODERATOR;
  }
}

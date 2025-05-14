import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, tap } from 'rxjs';
import { EMPTY } from 'rxjs';
import { AdminNewsletterService, NewsletterStats, Subscriber } from '../../shared/services/admin-newsletter.service';

@Component({
  selector: 'app-newsletter-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './newsletter-admin.component.html',
  styleUrls: ['./newsletter-admin.component.scss', '../../styles/admin-page-styles.scss']
})
export class NewsletterAdminComponent implements OnInit {
  private readonly adminNewsletterService = inject(AdminNewsletterService);
  private readonly formBuilder = inject(UntypedFormBuilder);
  private readonly toastr = inject(ToastrService);

  protected readonly isLoading = signal(false);
  protected readonly isSending = signal(false);
  protected readonly stats = signal<NewsletterStats | null>(null);
  protected readonly subscribers = signal<Subscriber[]>([]);
  protected readonly activeTab = signal<'stats' | 'send' | 'subscribers'>('stats');

  protected readonly statsCards = computed(() => {
    const statsData = this.stats();
    if (!statsData) return [];

    return [
      {
        title: 'Aktīvie abonenti',
        value: statsData.active_subscribers,
        icon: 'fas fa-users',
        color: 'success'
      },
      {
        title: 'Kopējie abonenti',
        value: statsData.total_subscribers,
        icon: 'fas fa-envelope',
        color: 'primary'
      },
      {
        title: 'Neaktīvie abonenti',
        value: statsData.inactive_subscribers,
        icon: 'fas fa-user-times',
        color: 'secondary'
      }
    ];
  });

  protected readonly newsletterForm = this.formBuilder.group({
    subject: ['', [Validators.required, Validators.maxLength(255)]],
    content: ['', [Validators.required]],
    send_to_all: [true]
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadSubscribers();
  }

  setActiveTab(tab: 'stats' | 'send' | 'subscribers'): void {
    this.activeTab.set(tab);
  }

  private loadStats(): void {
    this.adminNewsletterService.getSubscriberStats()
      .pipe(
        tap(response => this.stats.set(response.data)),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt statistiku');
          return EMPTY;
        })
      )
      .subscribe();
  }

  private loadSubscribers(): void {
    this.adminNewsletterService.getSubscribers()
      .pipe(
        tap(response => this.subscribers.set(response.data)),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt abonentu sarakstu');
          return EMPTY;
        })
      )
      .subscribe();
  }

  onSubmitNewsletter(): void {
    if (this.newsletterForm.invalid) {
      this.toastr.error('Lūdzu, aizpildiet visus obligātos laukus');
      return;
    }

    const formData = this.newsletterForm.value;
    this.isSending.set(true);

    this.adminNewsletterService.sendNewsletter(formData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastr.success(response.message);
            this.newsletterForm.reset();
            this.newsletterForm.patchValue({ send_to_all: true });
          } else {
            this.toastr.error(response.message);
          }
        }),
        catchError(error => {
          this.toastr.error('Neizdevās nosūtīt jaunumus');
          return EMPTY;
        }),
        finalize(() => this.isSending.set(false))
      )
      .subscribe();
  }

  insertTemplate(template: string): void {
    const contentControl = this.newsletterForm.get('content');
    const currentContent = contentControl?.value || '';

    let templateContent = '';

    switch (template) {
      case 'welcome':
        templateContent = `<h1 style="color: #8B0000; margin-bottom: 20px;">Sveiki!</h1>
<p>Mēs esam priecīgi jūs informēt par jaunākajiem produktiem un piedāvājumiem.</p>
<div style="background: #FBEAEB; padding: 20px; margin: 20px 0; border-left: 4px solid #8B0000; border-radius: 8px;">
  <p><strong>Šodien mums ir īpaši piedāvājumi!</strong></p>
</div>`;
        break;
      case 'promotion':
        templateContent = `<h1 style="color: #8B0000; margin-bottom: 20px;">🎉 Īpašais piedāvājums!</h1>
<p>Nepalaidiet garām šo fantastisko piedāvājumu!</p>
<div style="text-align: center; margin: 30px 0;">
  <a href="#" style="background: linear-gradient(135deg, #8B0000 0%, #B22222 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600;">
    Iegūt piedāvājumu
  </a>
</div>`;
        break;
      case 'announcement':
        templateContent = `<h1 style="color: #8B0000; margin-bottom: 20px;">📢 Svarīgs paziņojums</h1>
<p>Mēs gribētu jūs informēt par svarīgām izmaiņām mūsu veikalā.</p>
<ul style="list-style: none; padding: 0;">
  <li style="margin: 10px 0;">✓ Pirmais punkts</li>
  <li style="margin: 10px 0;">✓ Otrais punkts</li>
  <li style="margin: 10px 0;">✓ Trešais punkts</li>
</ul>`;
        break;
    }

    contentControl?.setValue(currentContent + templateContent);
  }

  protected getSubscriberStatusClass(subscriber: Subscriber): string {
    return subscriber.is_active ? 'badge active' : 'badge inactive';
  }

  protected getSubscriberStatusText(subscriber: Subscriber): string {
    return subscriber.is_active ? 'Aktīvs' : 'Neaktīvs';
  }

  protected formatDate(date: string): string {
    return new Date(date).toLocaleDateString('lv-LV', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

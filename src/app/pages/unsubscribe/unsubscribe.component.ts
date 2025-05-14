import { Component, OnInit, inject, WritableSignal, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {NewsletterResponse, NewsletterService} from "../../components/main/service/newsletter.service";

@Component({
  selector: 'app-unsubscribe',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './unsubscribe.component.html',
  styleUrls: ['./unsubscribe.component.scss']
})
export class UnsubscribeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly newsletterService = inject(NewsletterService);
  private readonly toastr = inject(ToastrService);

  isLoading: WritableSignal<boolean> = signal(false);
  token: string | null = null;
  unsubscribeStatus: WritableSignal<'prompt' | 'success' | 'error' | 'already_unsubscribed' | 'invalid_token'> = signal('prompt');
  message: WritableSignal<string> = signal('');
  appName: string = 'NetNest';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.unsubscribeStatus.set('invalid_token');
      this.message.set('Trūkst atrakstīšanās marķiera vai saite ir nepilnīga.');
      this.toastr.error(this.message());
    }
  }

  confirmUnsubscribe(): void {
    if (!this.token) {
      this.unsubscribeStatus.set('invalid_token');
      this.message.set('Nevarēja atrakstīties: marķieris nav atrasts.');
      this.toastr.error(this.message());
      return;
    }

    this.isLoading.set(true);
    this.message.set('');

    this.newsletterService.unsubscribe(this.token)
      .pipe(
        tap((response: NewsletterResponse) => {
          if (response.success) {
            if (response.message && response.message.toLowerCase().includes('jau esat atrakstījies')) {
              this.unsubscribeStatus.set('already_unsubscribed');
            } else {
              this.unsubscribeStatus.set('success');
            }
            this.message.set(response.message || 'Jūs esat veiksmīgi atrakstījies no jaunumiem.');
            this.toastr.success(this.message());
          } else {
            this.unsubscribeStatus.set('error');
            this.message.set(response.message || 'Neizdevās atrakstīties.');
            this.toastr.error(this.message());
          }
        }),
        catchError((error: HttpErrorResponse) => {
          const errorMsg = error.error?.message || 'Radās neparedzēta kļūda atrakstoties.';
          this.message.set(errorMsg);

          if (error.status === 404) {
            this.unsubscribeStatus.set('invalid_token');
            this.message.set('Atrakstīšanās saite nav derīga vai marķieris nav atrasts.');
          } else if (error.error?.message && error.error.message.toLowerCase().includes('jau esat atrakstījies')) {
            this.unsubscribeStatus.set('already_unsubscribed');
          } else {
            this.unsubscribeStatus.set('error');
          }
          this.toastr.error(this.message());
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  getYear(): number {
    return new Date().getFullYear();
  }
}

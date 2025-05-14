import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ApiUrlService} from "../../../../shared/services/api.service";

export interface NewsletterStats {
  active_subscribers: number;
  total_subscribers: number;
  inactive_subscribers: number;
}

export interface Subscriber {
  id: number;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at?: string;
  created_at: string;
}

export interface SendNewsletterRequest {
  subject: string;
  content: string;
  send_to_all: boolean;
}

export interface SendNewsletterResponse {
  message: string;
  success: boolean;
  data: {
    sent_count: number;
    total_subscribers: number;
    errors_count: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminNewsletterService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getSubscriberStats(): Observable<{ data: NewsletterStats }> {
    return this.http.get<{ data: NewsletterStats }>(
      this.apiUrlService.getUrl('api/admin/newsletter/stats')
    );
  }

  getSubscribers(): Observable<{ data: Subscriber[] }> {
    return this.http.get<{ data: Subscriber[] }>(
      this.apiUrlService.getUrl('api/admin/newsletter/subscribers')
    );
  }

  sendNewsletter(data: SendNewsletterRequest): Observable<SendNewsletterResponse> {
    return this.http.post<SendNewsletterResponse>(
      this.apiUrlService.getUrl('api/admin/newsletter/send'),
      data
    );
  }
}

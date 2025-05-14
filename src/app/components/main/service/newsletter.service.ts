import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiUrlService } from '../../../shared/services/api.service';

export interface NewsletterSubscribeRequest {
  email: string;
}

export interface NewsletterResponse {
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  subscribe(email: string): Observable<NewsletterResponse> {
    return this.http.post<NewsletterResponse>(
      this.apiUrlService.getUrl('api/newsletter/subscribe'),
      { email }
    );
  }

  unsubscribe(token: string): Observable<NewsletterResponse> {
    return this.http.post<NewsletterResponse>(
      this.apiUrlService.getUrl('api/newsletter/unsubscribe'),
      { token }
    );
  }
}

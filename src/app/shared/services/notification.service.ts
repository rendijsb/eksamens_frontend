import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiUrlService } from './api.service';
import {
  NotificationPreferences,
  NotificationPreferencesResponse,
  UpdateNotificationPreferencesRequest
} from '../models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getNotificationPreferences(): Observable<NotificationPreferencesResponse> {
    return this.http.get<NotificationPreferencesResponse>(
      this.apiUrlService.getUrl('api/profile/notifications/preferences')
    );
  }

  updateNotificationPreferences(preferences: UpdateNotificationPreferencesRequest): Observable<NotificationPreferencesResponse> {
    return this.http.put<NotificationPreferencesResponse>(
      this.apiUrlService.getUrl('api/profile/notifications/preferences'),
      preferences
    );
  }
}

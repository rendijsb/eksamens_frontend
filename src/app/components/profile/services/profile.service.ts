import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiUrlService } from '../../../shared/services/api.service';
import { User } from '../../auth/models/user.models';

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  data?: User;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getUserProfile(): Observable<{ data: User }> {
    return this.http.get<{ data: User }>(
      this.apiUrlService.getUrl('api/profile')
    );
  }

  updateUserProfile(data: FormData | any): Observable<ProfileUpdateResponse> {
    return this.http.post<ProfileUpdateResponse>(
      this.apiUrlService.getUrl('api/profile/update'),
      data
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<ProfileUpdateResponse> {
    return this.http.post<ProfileUpdateResponse>(
      this.apiUrlService.getUrl('api/profile/change-password'),
      data
    );
  }

  updateProfileImage(data: FormData): Observable<ProfileUpdateResponse> {
    return this.http.post<ProfileUpdateResponse>(
      this.apiUrlService.getUrl('api/profile/update-image'),
      data
    );
  }

  removeProfileImage(): Observable<ProfileUpdateResponse> {
    return this.http.delete<ProfileUpdateResponse>(
      this.apiUrlService.getUrl('api/profile/remove-image')
    );
  }
}

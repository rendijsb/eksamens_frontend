import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiUrlService } from '../../../shared/services/api.service';

export interface AboutPage {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  address: string;
  email: string;
  phone: string;
  working_hours: string | null;
  map_embed_code: string | null;
  additional_info: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface AboutPageResponse {
  data: AboutPage;
}

export interface AllAboutPagesResponse {
  data: AboutPage[];
}

export interface ContactResponse {
  data: Contact;
}

export interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PagesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getAboutPage(): Observable<AboutPageResponse> {
    return this.http.get<AboutPageResponse>(
      this.apiUrlService.getUrl('api/public/pages/about')
    );
  }

  getContactInfo(): Observable<ContactResponse> {
    return this.http.get<ContactResponse>(
      this.apiUrlService.getUrl('api/public/pages/contact')
    );
  }

  sendContactForm(formData: ContactFormData): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      this.apiUrlService.getUrl('api/public/pages/contact/send'),
      formData
    );
  }

  getAllAboutPages(): Observable<AllAboutPagesResponse> {
    return this.http.get<AllAboutPagesResponse>(
      this.apiUrlService.getUrl('api/admin/pages/about')
    );
  }

  createAboutPage(aboutPage: Partial<AboutPage>): Observable<AboutPageResponse> {
    return this.http.post<AboutPageResponse>(
      this.apiUrlService.getUrl('api/admin/pages/about/create'),
      aboutPage
    );
  }

  updateAboutPage(id: number, aboutPage: Partial<AboutPage>): Observable<AboutPageResponse> {
    return this.http.put<AboutPageResponse>(
      this.apiUrlService.getUrl(`api/admin/pages/about/${id}`),
      aboutPage
    );
  }

  deleteAboutPage(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      this.apiUrlService.getUrl(`api/admin/pages/about/${id}`)
    );
  }

  updateContactInfo(contact: Partial<Contact>): Observable<ContactResponse> {
    return this.http.put<ContactResponse>(
      this.apiUrlService.getUrl('api/admin/pages/contact/update'),
      contact
    );
  }

  getAboutPageById(id: number): Observable<AboutPageResponse> {
    return this.http.get<AboutPageResponse>(
      this.apiUrlService.getUrl(`api/admin/pages/about/${id}`)
    );
  }
}

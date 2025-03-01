import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiUrlService {
  private readonly apiUrl = environment.apiUrl;

  getUrl(endpoint: string): string {
    endpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${this.apiUrl}/${endpoint}`;
  }

  get baseUrl(): string {
    return this.apiUrl;
  }
}

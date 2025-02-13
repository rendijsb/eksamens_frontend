import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  register(data: any) {
    return this.http.post('http://localhost:8000/api/auth/register', data);
  }
}

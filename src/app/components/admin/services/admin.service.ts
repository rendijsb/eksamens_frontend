import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable, tap} from "rxjs";
import {User} from "../../auth/models/user.models";

interface UsersResponse {
  data: User[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);

  getUsers(): Observable<UsersResponse> {
    return this.http.get('http://localhost:8000/api/user/getAll') as Observable<UsersResponse>;
  }
}

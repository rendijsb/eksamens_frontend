import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable, tap} from "rxjs";
import {User} from "../../auth/models/user.models";

interface UsersResponse {
  data: User[];
}

interface EmptyResponse {}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);

  getUsers(): Observable<UsersResponse> {
    return this.http.get('http://localhost:8000/api/user/getAll') as Observable<UsersResponse>;
  }

  deleteUser(userId: number): Observable<EmptyResponse> {
    return this.http.delete(`http://localhost:8000/api/user/delete/${userId}`) as Observable<EmptyResponse>;
  }
}

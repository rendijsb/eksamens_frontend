import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {User} from "../../../auth/models/user.models";
import {ApiUrlService} from "../../../../shared/services/api.service";

interface UsersResponse {
  data: User[];
}

interface SingleUsersResponse {
  data: User;
}

interface EmptyResponse {}

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getUsers(params?: { search?: string, sort_by?: string, sort_dir?: string }): Observable<UsersResponse> {
    let queryParams = new HttpParams();

    if (params?.search) {
      queryParams = queryParams.append('search', params.search);
    }

    if (params?.sort_by) {
      queryParams = queryParams.append('sort_by', params.sort_by);
      queryParams = queryParams.append('sort_dir', params.sort_dir || 'asc');
    }

    return this.http.get(this.apiUrlService.getUrl('api/user/getAll'), {params: queryParams}) as Observable<UsersResponse>;
  }

  deleteUser(userId: number): Observable<EmptyResponse> {
    return this.http.delete(this.apiUrlService.getUrl(`api/user/delete/${userId}`)) as Observable<EmptyResponse>;
  }

  getUserById(userId: number): Observable<SingleUsersResponse> {
    return this.http.get(this.apiUrlService.getUrl(`api/user/${userId}`)) as Observable<SingleUsersResponse>;
  }

  createUser(data: FormData): Observable<SingleUsersResponse> {
    return this.http.post(this.apiUrlService.getUrl('api/user/create'), data) as Observable<SingleUsersResponse>;
  }

  editUser(data: FormData, userId: number): Observable<SingleUsersResponse> {
    return this.http.patch(this.apiUrlService.getUrl(`api/user/edit/${userId}`), data) as Observable<SingleUsersResponse>;
  }
}

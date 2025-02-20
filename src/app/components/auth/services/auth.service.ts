import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { RoleEnum, User } from "../models/user.models";
import { Router } from "@angular/router";
import { tap } from "rxjs";

interface AuthResponse {
  data: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'user_data';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private currentUser = signal<User | null>(this.getUserFromStorage());
  private token = signal<string | null>(this.getTokenFromStorage());

  readonly isAdmin = computed(() => this.currentUser()?.role === RoleEnum.ADMIN);
  readonly isModerator = computed(() => this.currentUser()?.role === RoleEnum.MODERATOR);
  readonly isClient = computed(() => this.currentUser()?.role === RoleEnum.CLIENT);
  readonly isAuthenticated = computed(() => !!this.getToken());

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  user() {
    return this.currentUser();
  }

  register(data: FormData) {
    return this.http.post<AuthResponse>('http://localhost:8000/api/auth/register', data)
      .pipe(
        tap(response => {
          const user = response.data;
          this.setUserData(user);
          this.currentUser.set(user);
          this.redirectBasedOnRole(user.role);
        })
      );
  }

  login(data: FormData) {
    return this.http.post<AuthResponse>('http://localhost:8000/api/auth/login', data)
      .pipe(
        tap(response => {
          const user = response.data;
          this.setUserData(user);
          this.currentUser.set(user);
          this.redirectBasedOnRole(user.role);
        })
      );
  }

  logout() {
    return this.http.post('http://localhost:8000/api/auth/logout', {}).pipe(
      tap(() => {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.currentUser.set(null);
        this.router.navigate(['/']);
      })
    );
  }

  private setUserData(user: User) {
    localStorage.setItem(this.tokenKey, <string>user.token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private redirectBasedOnRole(role: RoleEnum) {
    switch (role) {
      case RoleEnum.ADMIN:
        this.router.navigate(['/admin/dashboard']);
        break;
      case RoleEnum.MODERATOR:
        this.router.navigate(['/admin/dashboard']);
        break;
      case RoleEnum.CLIENT:
        this.router.navigate(['/']);
        break;
    }
  }

  handleSuccessfulLogin(user: User) {
    this.setUserData(user);
    this.currentUser.set(user);
    this.redirectBasedOnRole(user.role);
  }
}

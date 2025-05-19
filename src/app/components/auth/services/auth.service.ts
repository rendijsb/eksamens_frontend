import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { RoleEnum, User } from "../models/user.models";
import { Router } from "@angular/router";
import { tap } from "rxjs";
import {ApiUrlService} from "../../../shared/services/api.service";

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
  private readonly apiUrlService = inject(ApiUrlService);

  private currentUser = signal<User | null>(this.getUserFromStorage());
  private token = signal<string | null>(this.getTokenFromStorage());

  readonly isAdmin = computed(() => this.currentUser()?.role === RoleEnum.ADMIN);
  readonly isModerator = computed(() => this.currentUser()?.role === RoleEnum.MODERATOR);
  readonly isClient = computed(() => this.currentUser()?.role === RoleEnum.CLIENT);
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  user() {
    return this.currentUser();
  }

  register(data: FormData) {
    return this.http.post<AuthResponse>(this.apiUrlService.getUrl('api/auth/register'), data)
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
    return this.http.post<AuthResponse>(this.apiUrlService.getUrl('api/auth/login'), data)
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
    return this.http.post(this.apiUrlService.getUrl('api/auth/logout'), {}).pipe(
      tap(() => {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.currentUser.set(null);
        this.token.set(null);
        this.checkAuthStatus();
        this.router.navigate(['/login']);
      })
    );
  }

  private setUserData(user: User) {
    localStorage.setItem(this.tokenKey, <string>user.token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.token.set(user.token || null);
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

  updateUserData(userData: Partial<User>) {
    if (!this.currentUser()) return;

    const updatedUser = {
      ...this.currentUser()!,
      ...userData
    };

    this.setUserData(updatedUser);
    this.currentUser.set(updatedUser);
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser() && !!localStorage.getItem('token');
  }

  checkAuthStatus(): void {
    const token = this.getTokenFromStorage();
    const userData = this.getUserFromStorage();

    if (token && userData) {
      this.currentUser.set(userData);
      this.token.set(token);
    } else {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      this.currentUser.set(null);
      this.token.set(null);
    }
  }

  forgotPassword(email: string) {
    const formData = new FormData();
    formData.append('email', email);
    return this.http.post<{message: string}>(
      this.apiUrlService.getUrl('api/auth/forgot-password'),
      formData
    );
  }

  resetPassword(token: string, email: string, password: string, passwordConfirmation: string) {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('password_confirmation', passwordConfirmation);
    return this.http.post<{message: string}>(
      this.apiUrlService.getUrl('api/auth/reset-password'),
      formData
    );
  }
}

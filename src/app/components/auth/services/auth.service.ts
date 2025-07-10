import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { RoleEnum, User } from "../models/user.models";
import { Router } from "@angular/router";
import {switchMap, tap} from "rxjs";
import {ApiUrlService} from "../../../shared/services/api.service";

interface AuthResponse {
  data: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly userKey = 'user_data';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrlService = inject(ApiUrlService);

  private currentUser = signal<User | null>(this.getUserFromStorage());

  readonly isAdmin = computed(() => this.currentUser()?.role === RoleEnum.ADMIN);
  readonly isModerator = computed(() => this.currentUser()?.role === RoleEnum.MODERATOR);
  readonly isClient = computed(() => this.currentUser()?.role === RoleEnum.CLIENT);
  readonly isAuthenticated = computed(() => !!this.currentUser());

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  user() {
    return this.currentUser();
  }

  register(data: FormData) {
    return this.http.get(this.apiUrlService.getUrl('sanctum/csrf-cookie'))
      .pipe(
        switchMap(() =>
          this.http.post<AuthResponse>(this.apiUrlService.getUrl('api/auth/register'), data)
        ),
        tap(response => {
          const user = response.data;
          this.setUserData(user);
          this.currentUser.set(user);
          this.redirectBasedOnRole(user.role);
        })
      );
  }

  login(data: FormData) {
    return this.http.get(this.apiUrlService.getUrl('sanctum/csrf-cookie'))
      .pipe(
        switchMap(() =>
          this.http.post<AuthResponse>(
            this.apiUrlService.getUrl('api/auth/login'),
            data
          )
        ),
        tap(response => {
          const user = response.data;
          this.setUserData(user);
          this.currentUser.set(user);
          this.redirectBasedOnRole(user.role);
        })
      );
  }

  logout() {
    return this.http.post(this.apiUrlService.getUrl('api/auth/logout'), {})
      .pipe(
        tap(() => {
          localStorage.removeItem(this.userKey);
          this.currentUser.set(null);
          this.router.navigate(['/login']);
        })
      );
  }

  private setUserData(user: User) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
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
    const userData = localStorage.getItem(this.userKey);
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
    return !!this.getCurrentUser();
  }

  checkAuthStatus(): void {
    const userData = this.getUserFromStorage();

    if (userData) {
      this.currentUser.set(userData);
    } else {
      localStorage.removeItem(this.userKey);
      this.currentUser.set(null);
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

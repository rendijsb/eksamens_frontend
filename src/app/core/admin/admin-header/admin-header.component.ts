import { Component, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../components/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, tap } from 'rxjs';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss']
})
export class AdminHeaderComponent {
  private readonly authService: AuthService = inject(AuthService);
  private readonly toastr: ToastrService = inject(ToastrService);
  private readonly router: Router = inject(Router);

  protected isMobileMenuOpen = signal(false);
  protected showUserMenu = signal(false);
  protected readonly isAdmin = computed(() => this.authService.isAdmin());

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element;

    if (!target.closest('.user-profile-dropdown') && this.showUserMenu()) {
      this.showUserMenu.set(false);
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
    if (this.isMobileMenuOpen()) {
      this.showUserMenu.set(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(value => !value);
  }

  closeAllMenus(): void {
    this.isMobileMenuOpen.set(false);
    this.showUserMenu.set(false);
    document.body.style.overflow = '';
  }

  logout(): void {
    this.closeAllMenus();

    this.authService.logout()
      .pipe(
        tap(() => {
          this.toastr.success('You have successfully logged out');
          this.router.navigate(['/login']);
        }),
        catchError(error => {
          this.toastr.error('Failed to log out');
          return EMPTY;
        })
      )
      .subscribe();
  }
}

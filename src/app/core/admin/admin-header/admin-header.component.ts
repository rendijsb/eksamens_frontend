import { Component, computed, inject, signal, HostListener } from '@angular/core';
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
  styleUrl: './admin-header.component.scss'
})
export class AdminHeaderComponent {
  private readonly authService: AuthService = inject(AuthService);
  private readonly toastr: ToastrService = inject(ToastrService);
  private readonly router: Router = inject(Router);

  protected isMobileMenuOpen = signal(false);
  protected showMoreMenu = signal(false);
  protected showUserMenu = signal(false);
  protected readonly isAdmin = computed(() => this.authService.isAdmin());

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element;

    if (!target.closest('.dropdown') && this.showMoreMenu()) {
      this.showMoreMenu.set(false);
    }

    if (!target.closest('.user-profile-dropdown') && this.showUserMenu()) {
      this.showUserMenu.set(false);
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);

    if (this.isMobileMenuOpen()) {
      this.showMoreMenu.set(false);
      this.showUserMenu.set(false);
    }
  }

  toggleMoreMenu(): void {
    this.showMoreMenu.update(value => !value);

    if (this.showMoreMenu()) {
      this.showUserMenu.set(false);
      this.isMobileMenuOpen.set(false);
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(value => !value);

    if (this.showUserMenu()) {
      this.showMoreMenu.set(false);
      this.isMobileMenuOpen.set(false);
    }
  }

  closeAllMenus(): void {
    this.isMobileMenuOpen.set(false);
    this.showMoreMenu.set(false);
    this.showUserMenu.set(false);
  }

  logout(): void {
    this.closeAllMenus();

    this.authService.logout()
      .pipe(
        tap(() => {
          this.toastr.success('Jūs esat veiksmīgi izgājuši no sistēmas');
          this.router.navigate(['/login']);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās iziet no sistēmas');
          return EMPTY;
        })
      )
      .subscribe();
  }
}

import { Component, computed, inject, signal } from '@angular/core';
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
  protected readonly isAdmin = computed(() => this.authService.isAdmin());

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  logout(): void {
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

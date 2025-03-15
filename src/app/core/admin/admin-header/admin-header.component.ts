import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  isMobileMenuOpen = false;

  protected readonly isAdmin = computed(() => this.authService.isAdmin());

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout(): void {
    this.authService.logout()
      .pipe(
        tap(() => {
          this.toastr.success('Jūs esat veiksmīgi izgājuši no sistēmas');
        }),
        catchError(error => {
          this.toastr.error('Neizdevās iziet no sistēmas');
          return EMPTY;
        })
      )
      .subscribe();
  }
}

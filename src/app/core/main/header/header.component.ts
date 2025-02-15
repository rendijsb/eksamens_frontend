import {Component, computed, inject, signal} from '@angular/core';
import {AuthService} from "../../../components/auth/services/auth.service";
import {catchError, EMPTY, tap} from "rxjs";
import {ToastrService} from "ngx-toastr";

@Component({
    selector: 'app-header',
    imports: [],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly authService: AuthService = inject(AuthService);
  private readonly toastr: ToastrService = inject(ToastrService);

  protected readonly isLoggedIn = computed(() => this.authService.isAuthenticated());

  logout() {
    this.authService.logout()
      .pipe(
        tap(() => {
          this.toastr.success('You have been logged out');
        }),
        catchError(error => {
          this.toastr.error('An error occurred while logging out');
          return EMPTY;
        })
      )
      .subscribe();
  }
}

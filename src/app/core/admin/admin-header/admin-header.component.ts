import {Component, computed, inject} from '@angular/core';
import {AuthService} from "../../../components/auth/services/auth.service";
import {ToastrService} from "ngx-toastr";
import {catchError, EMPTY, tap} from "rxjs";

@Component({
    selector: 'app-admin-header',
    imports: [],
    templateUrl: './admin-header.component.html',
    styleUrl: '../../main/header/header.component.scss'
})
export class AdminHeaderComponent {
  private readonly authService: AuthService = inject(AuthService);
  private readonly toastr: ToastrService = inject(ToastrService);

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

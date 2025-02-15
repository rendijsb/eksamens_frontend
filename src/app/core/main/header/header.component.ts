import {Component, computed, inject} from '@angular/core';
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
          this.toastr.success('Jūs esat izgājuši no sistēmas');
        }),
        catchError(error => {
          this.toastr.error('Neizdevās iziet no sistēmas');
          return EMPTY;
        })
      )
      .subscribe();
  }
}

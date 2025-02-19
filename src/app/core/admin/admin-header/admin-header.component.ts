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

  protected readonly isAdmin = computed(() => this.authService.isAdmin());

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

import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {AdminUserService} from "../services/admin-user.service";
import {catchError, EMPTY, finalize, tap} from "rxjs";
import {ToastrService} from "ngx-toastr";
import {RoleEnum, User} from "../../../auth/models/user.models";
import {Router} from "@angular/router";

@Component({
  selector: 'app-users',
  imports: [],
  templateUrl: './users.component.html',
  styleUrl: '../../styles/data-table-styles.scss'
})
export class UsersComponent implements OnInit {
  private readonly adminService: AdminUserService = inject(AdminUserService);
  private readonly toastr: ToastrService = inject(ToastrService);
  protected readonly router = inject(Router);

  protected readonly userData: WritableSignal<User[]> = signal<User[]>([]);

  getRoleName(roleId: number): string {
    switch (roleId) {
      case RoleEnum.ADMIN:
        return 'Administrators';
      case RoleEnum.MODERATOR:
        return 'Moderators';
      case RoleEnum.CLIENT:
        return 'Klients';
      default:
        return 'Nezināma loma';
    }
  }

  ngOnInit(): void {
    this.getUserData();
  }

  getUserData(): void {
    this.adminService.getUsers()
      .pipe(
        tap((response) => {
          this.userData.set(response.data);
        }),
        catchError((error) => {
          this.toastr.error('Neizdevās iegūt lietotāju datus');
          return EMPTY;
        })
      )
      .subscribe();
  }

  deleteUser(userId: number): void {
    this.adminService.deleteUser(userId)
      .pipe(
        tap(() => {
          this.toastr.success('Lietotājs veiksmīgi dzēsts');
        }),
        catchError((error) => {
          this.toastr.error('Neizdevās dzēst lietotāju');
          return EMPTY;
        }),
        finalize((): void => {
          this.getUserData();
        })
      )
      .subscribe();
  }

  createOrEdit(userId?: number): void {
    if (userId) {
      this.router.navigate(['/admin/users', userId, 'edit']);
    } else {
      this.router.navigate(['/admin/users/create']);
    }
  }

  formatCreatedAt(createdAt: string): string {
    return new Date(createdAt).toDateString();
  }
}

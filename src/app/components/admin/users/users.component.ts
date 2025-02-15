import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {AdminService} from "../services/admin.service";
import {catchError, EMPTY, tap} from "rxjs";
import {ToastrService} from "ngx-toastr";
import {RoleEnum, User} from "../../auth/models/user.models";

@Component({
    selector: 'app-users',
    imports: [],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private readonly adminService: AdminService = inject(AdminService);
  private readonly toastr: ToastrService = inject(ToastrService);

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
          console.log(this.userData());
        }),
        catchError((error) => {
          this.toastr.error('Failed to fetch users');
          return EMPTY;
        })
      )
      .subscribe();
  }

  formatCreatedAt(createdAt: string): string {
    return new Date(createdAt).toDateString();
  }
}

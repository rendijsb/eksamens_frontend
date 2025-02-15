import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {AdminService} from "../services/admin.service";
import {catchError, EMPTY, finalize, tap} from "rxjs";
import {ToastrService} from "ngx-toastr";
import {RoleEnum, User} from "../../auth/models/user.models";
import {ModalService} from "../../../shared/services/modal.service";
import {UserFormModalComponent} from "./user-form-modal/user-form-modal.component";

@Component({
    selector: 'app-users',
  imports: [
    UserFormModalComponent
  ],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private readonly adminService: AdminService = inject(AdminService);
  private readonly toastr: ToastrService = inject(ToastrService);
  protected readonly modalService = inject(ModalService);

  protected readonly userData: WritableSignal<User[]> = signal<User[]>([]);
  protected readonly isModalOpen = this.modalService.isOpen;
  protected selectedUser?: User;

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

  formatCreatedAt(createdAt: string): string {
    return new Date(createdAt).toDateString();
  }

  openUserForm(user?: User): void {
    this.selectedUser = user;
    this.modalService.open();
  }

  onUserSaved(): void {
    this.modalService.close();
    this.getUserData();
  }
}

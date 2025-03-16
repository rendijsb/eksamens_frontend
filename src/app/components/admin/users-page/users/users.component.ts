import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {AdminUserService} from "../services/admin-user.service";
import {catchError, distinctUntilChanged, EMPTY, finalize, Subject, tap, debounceTime} from "rxjs";
import {ToastrService} from "ngx-toastr";
import {RoleEnum, User} from "../../../auth/models/user.models";
import {Router} from "@angular/router";
import {PaginationMeta} from "../../../../shared/models/pagination.models";

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
  protected readonly searchTerm: WritableSignal<string> = signal<string>('');
  protected readonly sortBy: WritableSignal<string> = signal<string>('id');
  protected readonly sortDir: WritableSignal<string> = signal<string>('desc');
  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly currentPage = signal<number>(1);

  private searchSubject = new Subject<string>();
  private readonly debounceTime: number = 300;

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
    this.searchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged(),
      tap((value: string) => {
        this.searchTerm.set(value);
        this.getUserData();
      })
    ).subscribe();

    this.getUserData();
  }

  getUserData(): void {
    this.adminService.getUsers({
      page: this.currentPage(),
      search: this.searchTerm(),
      sort_by: this.sortBy(),
      sort_dir: this.sortDir()
    })
      .pipe(
        tap((response) => {
          this.userData.set(response.data);
          this.pagination.set(response.meta);
        }),
        catchError((error) => {
          this.toastr.error('Neizdevās iegūt lietotāju datus');
          return EMPTY;
        })
      )
      .subscribe();
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }

    this.getUserData();
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

  getDisplayRange(): { start: number, end: number, total: number } {
    if (!this.pagination()) {
      return { start: 0, end: 0, total: 0 };
    }

    const paginationData = this.pagination()!;
    const start = (this.currentPage() - 1) * paginationData.per_page + 1;
    const end = Math.min(this.currentPage() * paginationData.per_page, paginationData.total);

    return { start, end, total: paginationData.total };
  }

  getPageNumbers(): number[] {
    if (!this.pagination()) return [];

    const totalPages = this.pagination()!.last_page;
    const currentPage = this.currentPage();

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    return Array.from({length: endPage - startPage + 1}, (_, i) => startPage + i);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.getUserData();
  }
}

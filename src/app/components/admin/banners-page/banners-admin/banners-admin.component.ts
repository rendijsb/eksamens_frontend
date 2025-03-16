import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Router } from "@angular/router";
import { AdminBannerService } from "../services/admin-banner.service";
import { Banner } from "../models/banner.models";
import { catchError, EMPTY, finalize, tap, Subject, debounceTime, distinctUntilChanged } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-banners-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './banners-admin.component.html',
  styleUrl: '../../styles/data-table-styles.scss'
})
export class BannersAdminComponent implements OnInit {
  private readonly router: Router = inject(Router);
  private readonly adminBannerService: AdminBannerService = inject(AdminBannerService);
  private readonly toastr: ToastrService = inject(ToastrService);

  protected readonly banners: WritableSignal<Banner[]> = signal<Banner[]>([]);
  protected readonly searchTerm: WritableSignal<string> = signal<string>('');
  protected readonly sortBy: WritableSignal<string> = signal<string>('id');
  protected readonly sortDir: WritableSignal<string> = signal<string>('desc');
  protected readonly statusFilter: WritableSignal<string> = signal<string>('');

  private searchSubject = new Subject<string>();
  private readonly debounceTime: number = 300;

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged(),
      tap((value: string) => {
        this.searchTerm.set(value);
        this.getBanners();
      })
    ).subscribe();

    this.getBanners();
  }

  createOrEdit(bannerId?: number): void {
    if (bannerId) {
      this.router.navigate(['/admin/banners', bannerId, 'edit']);
    } else {
      this.router.navigate(['/admin/banners/create']);
    }
  }

  getBanners(): void {
    let statusParam: boolean | undefined = undefined;

    if (this.statusFilter() === 'active') {
      statusParam = true;
    } else if (this.statusFilter() === 'inactive') {
      statusParam = false;
    }

    this.adminBannerService.getBanners({
      search: this.searchTerm(),
      sort_by: this.sortBy(),
      sort_dir: this.sortDir(),
      status: statusParam
    })
      .pipe(
        tap((response): void => {
          this.banners.set(response.data);
        }),
        catchError(() => {
          this.toastr.error('Nevarēja ielādēt banerus');
          return EMPTY;
        })
      )
      .subscribe();
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
    this.getBanners();
  }

  onSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
    this.getBanners();
  }

  deleteBanner(bannerId: number): void {
    if (!confirm('Vai tiešām vēlaties dzēst šo baneri?')) {
      return;
    }

    this.adminBannerService.deleteBanner(bannerId)
      .pipe(
        tap(() => {
          this.toastr.success('Baneris veiksmīgi dzēsts');
        }),
        catchError((error) => {
          this.toastr.error('Neizdevās dzēst baneri');
          return EMPTY;
        }),
        finalize((): void => {
          this.getBanners();
        })
      )
      .subscribe();
  }

  formatCreatedAt(createdAt: string): string {
    return new Date(createdAt).toDateString();
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Aktīvs' : 'Neaktīvs';
  }
}

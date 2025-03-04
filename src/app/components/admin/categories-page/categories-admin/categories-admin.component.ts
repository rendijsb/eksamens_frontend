import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Router } from "@angular/router";
import { AdminCategoryService } from "../services/admin-category.service";
import { CategoriesResponse, Category } from "../models/categories.models";
import { catchError, EMPTY, finalize, tap, Subject, debounceTime, distinctUntilChanged } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-categories-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-admin.component.html',
  styleUrl: '../../styles/data-table-styles.scss'
})
export class CategoriesAdminComponent implements OnInit {
  private readonly router: Router = inject(Router);
  private readonly adminCategoryService: AdminCategoryService = inject(AdminCategoryService);
  private readonly toastr: ToastrService = inject(ToastrService);

  protected readonly categories: WritableSignal<Category[]> = signal<Category[]>([]);
  protected readonly searchTerm: WritableSignal<string> = signal<string>('');
  protected readonly sortBy: WritableSignal<string> = signal<string>('id');
  protected readonly sortDir: WritableSignal<string> = signal<string>('desc');

  private searchSubject = new Subject<string>();
  private readonly debounceTime: number = 300;

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged(),
      tap((value: string) => {
        this.searchTerm.set(value);
        this.getCategories();
      })
    ).subscribe();

    this.getCategories();
  }

  createOrEdit(categoryId?: number): void {
    if (categoryId) {
      this.router.navigate(['/admin/categories', categoryId, 'edit']);
    } else {
      this.router.navigate(['/admin/categories/create']);
    }
  }

  getCategories(): void {
    this.adminCategoryService.getCategories({
      search: this.searchTerm(),
      sort_by: this.sortBy(),
      sort_dir: this.sortDir()
    })
      .pipe(
        tap((response: CategoriesResponse): void => {
          this.categories.set(response.data);
        }),
        catchError(() => {
          this.toastr.error('Nevarēja ielādēt kategorijas');
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
    this.getCategories();
  }

  deleteCategory(categoryId: number): void {
    this.adminCategoryService.deleteCategory(categoryId)
      .pipe(
        tap(() => {
          this.toastr.success('Kategorija veiksmīgi dzēsta');
        }),
        catchError((error) => {
          this.toastr.error('Neizdevās dzēst kategoriju');
          return EMPTY;
        }),
        finalize((): void => {
          this.getCategories();
        })
      )
      .subscribe();
  }

  formatCreatedAt(createdAt: string): string {
    return new Date(createdAt).toDateString();
  }
}

import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {Router} from "@angular/router";
import {AdminCategoryService} from "../services/admin-category.service";
import {CategoriesResponse, Category} from "../models/categories.models";
import {catchError, EMPTY, tap} from "rxjs";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-categories-admin',
  imports: [],
  templateUrl: './categories-admin.component.html',
  styleUrl: '../../styles/data-table-styles.scss'
})
export class CategoriesAdminComponent implements OnInit {
  private readonly router: Router = inject(Router);
  private readonly adminCategoryService: AdminCategoryService = inject(AdminCategoryService);
  private readonly toastr: ToastrService = inject(ToastrService);

  protected readonly categories: WritableSignal<Category[]> = signal<Category[]>([])
  ngOnInit(): void {
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
    this.adminCategoryService.getCategories()
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
}

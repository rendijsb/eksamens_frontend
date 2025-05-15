import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import {PublicService} from "../service/public.service";
import {Category} from "../../admin/categories-page/models/categories.models";

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  private readonly publicService = inject(PublicService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  protected readonly categories: WritableSignal<Category[]> = signal([]);
  protected readonly isLoading: WritableSignal<boolean> = signal(true);
  protected readonly hasError: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.fetchAllCategories();
  }

  fetchAllCategories(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.publicService.getAllCategories()
      .pipe(
        tap((response) => {
          if (response && response.data) {
            this.categories.set(response.data);
          } else {
            this.categories.set([]);
          }
        }),
        catchError((error) => {
          this.hasError.set(true);
          this.categories.set([]);
          this.toastr.error('Neizdevās ielādēt kategorijas');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  navigateToProducts(categoryId?: number): void {
    if (categoryId) {
      this.router.navigate(['/products'], {
        queryParams: { category: categoryId }
      });
    } else {
      this.router.navigate(['/products']);
    }
  }

  retryLoading(): void {
    this.fetchAllCategories();
  }
}

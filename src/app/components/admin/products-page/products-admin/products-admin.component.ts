import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Router } from "@angular/router";
import { AdminProductService } from "../services/admin-product.service";
import { Product } from "../models/products.models";
import { AdminCategoryService } from "../../categories-page/services/admin-category.service";
import { Category } from "../../categories-page/models/categories.models";
import { catchError, EMPTY, finalize, tap, Subject, debounceTime, distinctUntilChanged } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ProductImagesAdminComponent } from "../../product-images-page/product-images-admin/product-images-admin.component";
import {PaginationMeta} from "../../../../shared/models/pagination.models";

@Component({
  selector: 'app-products-admin',
  imports: [
    CommonModule,
    FormsModule,
    ProductImagesAdminComponent
  ],
  templateUrl: './products-admin.component.html',
  styleUrl: '../../styles/data-table-styles.scss'
})
export class ProductsAdminComponent implements OnInit {
  private readonly router: Router = inject(Router);
  private readonly adminProductService: AdminProductService = inject(AdminProductService);
  private readonly adminCategoryService: AdminCategoryService = inject(AdminCategoryService);
  private readonly toastr: ToastrService = inject(ToastrService);

  protected readonly products: WritableSignal<Product[]> = signal<Product[]>([]);
  protected readonly categories: WritableSignal<Category[]> = signal<Category[]>([]);
  protected readonly searchTerm: WritableSignal<string> = signal<string>('');
  protected readonly sortBy: WritableSignal<string> = signal<string>('id');
  protected readonly sortDir: WritableSignal<string> = signal<string>('desc');
  protected readonly selectedCategory: WritableSignal<number | null> = signal<number | null>(null);
  protected readonly selectedStatus: WritableSignal<'active' | 'inactive' | null> = signal<'active' | 'inactive' | null>(null);
  protected readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly currentPage = signal<number>(1);

  showImageModal = signal(false);
  selectedProductId = signal<number | null>(null);

  private searchSubject = new Subject<string>();
  private readonly debounceTime: number = 300;

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged(),
      tap((value: string) => {
        this.searchTerm.set(value);
        this.getProducts();
      })
    ).subscribe();

    this.getCategories();
    this.getProducts();
  }

  createOrEdit(productId?: number): void {
    if (productId) {
      this.router.navigate(['/admin/products', productId, 'edit']);
    } else {
      this.router.navigate(['/admin/products/create']);
    }
  }

  getProducts(): void {
    this.isLoading.set(true);

    this.adminProductService.getProducts({
      page: this.currentPage(),
      search: this.searchTerm(),
      sort_by: this.sortBy(),
      sort_dir: this.sortDir(),
      category_id: this.selectedCategory(),
      status: this.selectedStatus()
    })
      .pipe(
        tap((response): void => {
          this.products.set(response.data);
          this.pagination.set(response.meta);
        }),
        catchError(() => {
          this.toastr.error('Nevarēja ielādēt produktus');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  getCategories(): void {
    this.adminCategoryService.getCategories()
      .pipe(
        tap((response): void => {
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

  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCategory.set(select.value ? parseInt(select.value) : null);
    this.getProducts();
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus.set(select.value as 'active' | 'inactive' | null);
    this.getProducts();
  }

  onSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
    this.getProducts();
  }

  deleteProduct(productId: number): void {
    this.adminProductService.deleteProduct(productId)
      .pipe(
        tap(() => {
          this.toastr.success('Produkts veiksmīgi dzēsts');
        }),
        catchError((error) => {
          this.toastr.error('Neizdevās dzēst produktu');
          return EMPTY;
        }),
        finalize((): void => {
          this.getProducts();
        })
      )
      .subscribe();
  }

  openImageModal(productId: number) {
    this.selectedProductId.set(productId);
    this.showImageModal.set(true);
  }

  formatPrice(price: any): string {
    if (price === null || price === undefined) {
      return '0.00';
    }

    const numPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(numPrice)) {
      return '0.00';
    }

    return numPrice.toFixed(2);
  }

  modalClosed(): void {
    this.getProducts();
    this.showImageModal.set(false);
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
    this.getProducts();
  }
}

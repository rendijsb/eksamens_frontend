import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { ValidationErrorDirective } from "../../../../shared/directives/validation-error/validation-error.directive";
import { ButtonLoaderDirective } from "../../../../shared/directives/button-loader/button-loader.directive";
import { AdminProductService } from "../services/admin-product.service";
import { AdminCategoryService } from "../../categories-page/services/admin-category.service";
import { Category } from "../../categories-page/models/categories.models";
import { CreateProductRequest } from "../models/products.models";
import { catchError, EMPTY, finalize, tap } from "rxjs";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-products-admin-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ValidationErrorDirective,
    ButtonLoaderDirective
  ],
  templateUrl: './products-admin-form.component.html',
  styleUrl: './products-admin-form.component.scss'
})
export class ProductsAdminFormComponent implements OnInit {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly adminProductService: AdminProductService = inject(AdminProductService);
  private readonly adminCategoryService: AdminCategoryService = inject(AdminCategoryService);
  private readonly router: Router = inject(Router);
  private readonly toastr: ToastrService = inject(ToastrService);
  private readonly fb: FormBuilder = inject(FormBuilder);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isSubmitted: WritableSignal<boolean> = signal(false);
  protected readonly isEditing: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly categories: WritableSignal<Category[]> = signal<Category[]>([]);

  protected readonly productForm = this.fb.group({
    category_id: ['', Validators.required],
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: ['', [Validators.required, Validators.min(0)]],
    sale_price: [''],
    stock: ['', [Validators.required, Validators.min(0)]],
    specifications: [''],
    additional_info: [''],
    status: ['inactive', Validators.required]
  });

  ngOnInit(): void {
    this.getCategories();

    const productId: number = this.route.snapshot.params['productId'];

    if (productId) {
      this.isEditing.set(true);
      this.getProduct(productId);
    }
  }

  getCategories(): void {
    this.adminCategoryService.getCategories()
      .pipe(
        tap((response) => {
          this.categories.set(response.data);
        }),
        catchError(() => {
          this.toastr.error('Nevarēja ielādēt kategorijas');
          return EMPTY;
        })
      )
      .subscribe();
  }

  getProduct(productId: number): void {
    this.isLoading.set(true);
    this.adminProductService.getProduct(productId)
      .pipe(
        tap((response) => {
          this.productForm.patchValue({
            category_id: response.data.category_id.toString(),
            name: response.data.name,
            description: response.data.description,
            price: String(response.data.price),
            sale_price: String(response.data.sale_price),
            stock: String(response.data.stock),
            specifications: response.data.specifications,
            additional_info: response.data.additional_info,
            status: response.data.status
          });
        }),
        catchError(() => {
          this.toastr.error('Nevarēja ielādēt produktu');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  submit(): void {
    this.isSubmitted.set(true);

    if (this.productForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    if (this.isEditing()) {
      this.editProduct();
    } else {
      this.createProduct();
    }
  }

  createProduct(): void {
    this.adminProductService.createProduct(this.generatePayload())
      .pipe(
        tap(() => {
          this.toastr.success('Produkts veiksmīgi izveidots');
          this.router.navigate(['/admin/products']);
        }),
        catchError((error: any) => {
          if (error.status === 422 && error.error?.message) {
            this.toastr.error(error.error.message);
          } else {
            this.toastr.error('Neizdevās izveidot produktu');
          }
          return EMPTY;
        }),
        finalize((): void => this.isLoading.set(false))
      )
      .subscribe();
  }

  editProduct(): void {
    const productId: number = this.route.snapshot.params['productId'];

    this.adminProductService.editProduct(productId, this.generatePayload())
      .pipe(
        tap(() => {
          this.toastr.success('Produkts veiksmīgi rediģēts');
          this.router.navigate(['/admin/products']);
        }),
        catchError((error: any) => {
          if (error.status === 422 && error.error?.message) {
            this.toastr.error(error.error.message);
          } else {
            this.toastr.error('Neizdevās rediģēt produktu');
          }
          return EMPTY;
        }),
        finalize((): void => this.isLoading.set(false))
      )
      .subscribe();
  }

  onCancel(): void {
    this.router.navigate(['/admin/products']);
  }

  generatePayload(): CreateProductRequest {
    return {
      category_id: parseInt(this.productForm.get('category_id')?.value || '0'),
      name: this.productForm.get('name')?.value || '',
      description: this.productForm.get('description')?.value || '',
      price: parseFloat(this.productForm.get('price')?.value || '0'),
      sale_price: this.productForm.get('sale_price')?.value ? parseFloat(<string>this.productForm.get('sale_price')?.value) : undefined,
      stock: parseInt(this.productForm.get('stock')?.value || '0'),
      specifications: this.productForm.get('specifications')?.value || undefined,
      additional_info: this.productForm.get('additional_info')?.value || undefined,
      status: (this.productForm.get('status')?.value || 'inactive') as 'active' | 'inactive'
    };
  }
}

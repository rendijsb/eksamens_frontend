import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ValidationErrorDirective} from "../../../../shared/directives/validation-error/validation-error.directive";
import {ButtonLoaderDirective} from "../../../../shared/directives/button-loader/button-loader.directive";
import {AdminCategoryService} from "../services/admin-category.service";
import {CreateCategoriesRequest} from "../models/categories.models";
import {catchError, EMPTY, finalize, tap} from "rxjs";

@Component({
  selector: 'app-categories-admin-form',
  imports: [
    ReactiveFormsModule,
    ValidationErrorDirective,
    ButtonLoaderDirective
  ],
  templateUrl: './categories-admin-form.component.html',
  styleUrl: './categories-admin-form.component.scss'
})
export class CategoriesAdminFormComponent implements OnInit {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly adminCategoryService: AdminCategoryService = inject(AdminCategoryService);
  private readonly router: Router = inject(Router);
  private readonly toastr: ToastrService = inject(ToastrService);
  private readonly fb: FormBuilder = inject(FormBuilder);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isSubmitted: WritableSignal<boolean> = signal(false);
  protected isEditing: WritableSignal<boolean> = signal<boolean>(false);

  protected readonly categoryForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required]
  });

  ngOnInit(): void {
    const categoryId: number = this.route.snapshot.params['categoryId'];

    if (categoryId) {
      this.isEditing.set(true);
      this.getCategory(categoryId);
    }
  }

  submit(): void {
    this.isSubmitted.set(true);

    if (this.categoryForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    if (this.isEditing()) {
      this.editCategory();
    } else {
      this.createCategory();
    }
  }

  getCategory(categoryId: number): void {
    this.adminCategoryService.getCategory(categoryId)
      .pipe(
        tap((response) => {
          this.categoryForm.patchValue(response.data);
        }),
        catchError(() => {
          this.toastr.error('Nevarēja ielādēt kategoriju');
          return EMPTY;
        })
      )
      .subscribe();
  }

  createCategory(): void {
    this.adminCategoryService.createCategory(this.generatePayload())
      .pipe(
        tap(() => {
          this.toastr.success('Kategorija veiksmīgi izveidota');
          this.router.navigate(['/admin/categories']);
        }),
        catchError((error: any) => {
          if (error.status === 422 && error.error?.message) {
            this.toastr.error('Kategorija ar šādu nosaukumu jau eksistē');
          } else {
            this.toastr.error('Neizdevās izveidot kategoriju');
          }
          return EMPTY;
        }),
        finalize((): void => this.isLoading.set(false))
      )
      .subscribe();
  }

  editCategory(): void {
    const categoryId: number = this.route.snapshot.params['categoryId'];

    this.adminCategoryService.editCategory(categoryId, this.generatePayload())
      .pipe(
        tap(() => {
          this.toastr.success('Kategorija veiksmīgi rediğēta');
          this.router.navigate(['/admin/categories']);
        }),
        catchError((error: any) => {
          if (error.status === 422 && error.error?.message) {
            this.toastr.error('Kategorija ar šādu nosaukumu jau eksistē');
          } else {
            this.toastr.error('Neizdevās rediğēt kategoriju');
          }
          return EMPTY;
        }),
        finalize((): void => this.isLoading.set(false))
      )
      .subscribe();
  }

  generatePayload(): CreateCategoriesRequest {
    return <CreateCategoriesRequest> {
      name: this.categoryForm.get('name')?.value,
      description: this.categoryForm.get('description')?.value
    }
  }
}

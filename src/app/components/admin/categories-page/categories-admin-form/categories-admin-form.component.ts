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
    }
  }

  submit(): void {
    this.isSubmitted.set(true);

    if (this.categoryForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    if (this.isEditing()) {
    } else {
      this.createCategory();
    }
  }

  createCategory(): void {
    this.adminCategoryService.createCategory(this.generatePayload())
      .pipe(
        tap(() => {
          this.toastr.success('Kategorija veiksmīgi izveidota');
          this.router.navigate(['/admin/categories']);
        }),
        catchError((error: any) => {
          this.toastr.error('Neizdevās izveidot kategoriju');
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

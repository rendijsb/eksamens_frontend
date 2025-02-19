import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AdminUserService} from "../../users-page/services/admin-user.service";
import {ToastrService} from "ngx-toastr";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ValidationErrorDirective} from "../../../../shared/directives/validation-error/validation-error.directive";
import {ButtonLoaderDirective} from "../../../../shared/directives/button-loader/button-loader.directive";

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

  }
}

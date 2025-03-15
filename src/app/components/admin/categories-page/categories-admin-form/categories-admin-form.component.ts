import {Component, ElementRef, HostListener, inject, OnInit, signal, ViewChild, WritableSignal} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {ValidationErrorDirective} from "../../../../shared/directives/validation-error/validation-error.directive";
import {ButtonLoaderDirective} from "../../../../shared/directives/button-loader/button-loader.directive";
import {AdminCategoryService} from "../services/admin-category.service";
import {catchError, EMPTY, finalize, tap} from "rxjs";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-categories-admin-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ValidationErrorDirective,
    ButtonLoaderDirective
  ],
  templateUrl: './categories-admin-form.component.html',
  styleUrl: './categories-admin-form.component.scss'
})
export class CategoriesAdminFormComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly adminCategoryService: AdminCategoryService = inject(AdminCategoryService);
  private readonly router: Router = inject(Router);
  private readonly toastr: ToastrService = inject(ToastrService);
  private readonly fb: FormBuilder = inject(FormBuilder);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isSubmitted: WritableSignal<boolean> = signal(false);
  protected isEditing: WritableSignal<boolean> = signal<boolean>(false);

  protected isDragging: WritableSignal<boolean> = signal(false);
  protected imagePreview: WritableSignal<string | null> = signal(null);
  protected imageError: WritableSignal<string | null> = signal(null);
  private selectedFile: File | null = null;
  private categoryId: number | null = null;

  protected readonly imageControl = new FormControl<string | null>(null, Validators.required);

  protected readonly categoryForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    image: this.imageControl
  });

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.params['categoryId'];

    if (this.categoryId) {
      this.isEditing.set(true);
      this.getCategory(this.categoryId);
    }
  }

  getCategory(categoryId: number): void {
    this.adminCategoryService.getCategory(categoryId)
      .pipe(
        tap((response) => {
          this.categoryForm.patchValue(response.data);
          this.imagePreview.set(response.data.image);

          if (response.data.image) {
            this.imageControl.setValue('existing-image');
          }
        }),
        catchError(() => {
          this.toastr.error('Nevarēja ielādēt kategoriju');
          return EMPTY;
        })
      )
      .subscribe();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processSelectedFile(file);
    }
  }

  processSelectedFile(file: File): void {
    this.imageError.set(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.imageError.set('Neatbalstīts attēla formāts. Lūdzu, izmantojiet JPG, PNG vai GIF.');
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      this.imageError.set('Attēls ir pārāk liels. Maksimālais izmērs ir 2MB.');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview.set(e.target?.result as string);
      this.imageControl.setValue(file.name);
    };
    reader.readAsDataURL(file);
  }

  triggerFileInput(event: Event): void {
    event.preventDefault();
    this.fileInput.nativeElement.click();
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.imagePreview.set(null);
    this.selectedFile = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    this.imageControl.setValue(null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.processSelectedFile(file);
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/categories']);
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

  createCategory(): void {
    this.adminCategoryService.createCategory(this.generatePayload())
      .pipe(
        tap((response) => {
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
        finalize((): void => {
          if (!this.selectedFile) {
            this.isLoading.set(false);
          }
        })
      )
      .subscribe();
  }

  editCategory(): void {
    const categoryId: number = this.route.snapshot.params['categoryId'];

    this.adminCategoryService.editCategory(categoryId, this.generatePayload())
      .pipe(
        tap(() => {
          this.toastr.success('Kategorija veiksmīgi rediģēta');
          this.router.navigate(['/admin/categories']);
        }),
        catchError((error: any) => {
          if (error.status === 422 && error.error?.message) {
            this.toastr.error('Kategorija ar šādu nosaukumu jau eksistē');
          } else {
            this.toastr.error('Neizdevās rediģēt kategoriju');
          }
          return EMPTY;
        }),
        finalize((): void => {
          if (!this.selectedFile) {
            this.isLoading.set(false);
          }
        })
      )
      .subscribe();
  }

  generatePayload(): FormData {
    const formData = new FormData();

    formData.append('name', this.categoryForm.get('name')?.value || '');
    formData.append('description', this.categoryForm.get('description')?.value || '');

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    return formData
  }
}

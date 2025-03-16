import { Component, ElementRef, HostListener, inject, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { ValidationErrorDirective } from "../../../../shared/directives/validation-error/validation-error.directive";
import { ButtonLoaderDirective } from "../../../../shared/directives/button-loader/button-loader.directive";
import { AdminBannerService } from "../services/admin-banner.service";
import { catchError, EMPTY, finalize, tap } from "rxjs";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-banner-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ValidationErrorDirective,
    ButtonLoaderDirective
  ],
  templateUrl: './banner-form.component.html',
  styleUrl: './banner-form.component.scss'
})
export class BannerFormComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly adminBannerService: AdminBannerService = inject(AdminBannerService);
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
  private bannerId: number | null = null;

  protected readonly imageControl = new FormControl<string | null>(null, Validators.required);

  protected readonly bannerForm = this.fb.group({
    title: ['', Validators.required],
    subtitle: ['', Validators.required],
    button_text: ['', Validators.required],
    button_link: ['', Validators.required],
    sort_order: [0, Validators.required],
    is_active: [true, Validators.required],
    image: this.imageControl
  });

  ngOnInit(): void {
    this.bannerId = this.route.snapshot.params['bannerId'];

    if (this.bannerId) {
      this.isEditing.set(true);
      this.getBanner(this.bannerId);
    }
  }

  getBanner(bannerId: number): void {
    this.adminBannerService.getBanner(bannerId)
      .pipe(
        tap((response) => {
          this.bannerForm.patchValue({
            title: response.data.title,
            subtitle: response.data.subtitle,
            button_text: response.data.button_text,
            button_link: response.data.button_link,
            sort_order: response.data.sort_order,
            is_active: response.data.is_active
          });

          this.imagePreview.set(response.data.image_link);

          if (response.data.image_link) {
            this.imageControl.setValue('existing-image');
          }
        }),
        catchError(() => {
          this.toastr.error('Nevarēja ielādēt baneri');
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
    this.router.navigate(['/admin/banners']);
  }

  submit(): void {
    this.isSubmitted.set(true);

    if (this.bannerForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    if (this.isEditing()) {
      this.editBanner();
    } else {
      this.createBanner();
    }
  }

  createBanner(): void {
    this.adminBannerService.createBanner(this.generatePayload())
      .pipe(
        tap((response) => {
          this.toastr.success('Baneris veiksmīgi izveidots');
          this.router.navigate(['/admin/banners']);
        }),
        catchError((error: any) => {
          if (error.status === 422 && error.error?.message) {
            this.toastr.error(error.error.message);
          } else {
            this.toastr.error('Neizdevās izveidot baneri');
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

  editBanner(): void {
    if (!this.bannerId) return;

    this.adminBannerService.editBanner(this.bannerId, this.generatePayload())
      .pipe(
        tap(() => {
          this.toastr.success('Baneris veiksmīgi rediģēts');
          this.router.navigate(['/admin/banners']);
        }),
        catchError((error: any) => {
          if (error.status === 422 && error.error?.message) {
            this.toastr.error(error.error.message);
          } else {
            this.toastr.error('Neizdevās rediģēt baneri');
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

    formData.append('title', this.bannerForm.get('title')?.value || '');
    formData.append('subtitle', this.bannerForm.get('subtitle')?.value || '');
    formData.append('button_text', this.bannerForm.get('button_text')?.value || '');
    formData.append('button_link', this.bannerForm.get('button_link')?.value || '');
    formData.append('sort_order', String(this.bannerForm.get('sort_order')?.value || 0));

    const isActive = this.bannerForm.get('is_active')?.value === true ? 1 : 0;
    formData.append('is_active', isActive.toString());

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    return formData;
  }
}

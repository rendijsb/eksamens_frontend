import { Component, ElementRef, HostListener, inject, input, OnInit, output, OutputEmitterRef, signal, ViewChild, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ProductImageService, ProductImage } from '../services/product-image.service';
import { catchError, EMPTY, finalize, tap } from 'rxjs';

@Component({
  selector: 'app-product-images-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-images-admin.component.html',
  styleUrl: './product-images-admin.component.scss'
})
export class ProductImagesAdminComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dropZone') dropZone!: ElementRef<HTMLLabelElement>;

  productId = input.required<number>();
  close = output<void>();

  private readonly productImageService = inject(ProductImageService);
  private readonly toastr = inject(ToastrService);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isUploading: WritableSignal<boolean> = signal(false);
  protected readonly images: WritableSignal<ProductImage[]> = signal<ProductImage[]>([]);
  protected readonly isDragging: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.loadImages();
  }

  loadImages(): void {
    this.isLoading.set(true);

    this.productImageService.getProductImages(this.productId())
      .pipe(
        tap(response => {
          this.images.set(response.data);
        }),
        catchError(() => {
          this.toastr.error('Neizdevās ielādēt attēlus');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles(Array.from(input.files));
    }
  }

  uploadFiles(files: File[]): void {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      this.toastr.warning('Lūdzu, izvēlieties derīgus attēla failus');
      return;
    }

    this.isUploading.set(true);

    this.productImageService.uploadImages(this.productId(), imageFiles)
      .pipe(
        tap(response => {
          this.images.update(currentImages => [...currentImages, ...response.data]);
          this.toastr.success(`${imageFiles.length} attēli veiksmīgi augšupielādēti`);

          if (this.fileInput?.nativeElement) {
            this.fileInput.nativeElement.value = '';
          }
        }),
        catchError(error => {
          if (error.status === 422) {
            this.toastr.error('Nederīgs attēla formāts vai izmērs pārāk liels');
          } else {
            this.toastr.error('Neizdevās augšupielādēt attēlus');
          }
          return EMPTY;
        }),
        finalize(() => {
          this.isUploading.set(false);
        })
      )
      .subscribe();
  }

  setPrimaryImage(imageId: number): void {
    this.productImageService.setPrimaryImage(imageId)
      .pipe(
        tap(() => {
          this.images.update(currentImages =>
            currentImages.map(img => ({
              ...img,
              is_primary: img.id === imageId
            }))
          );
          this.toastr.success('Galvenais attēls iestatīts');
        }),
        catchError(() => {
          this.toastr.error('Neizdevās iestatīt galveno attēlu');
          return EMPTY;
        })
      )
      .subscribe();
  }

  deleteImage(imageId: number): void {
    if (!confirm('Vai tiešām vēlaties dzēst šo attēlu?')) {
      return;
    }

    this.productImageService.deleteImage(imageId)
      .pipe(
        tap(() => {
          this.images.update(currentImages =>
            currentImages.filter(img => img.id !== imageId)
          );
          this.toastr.success('Attēls veiksmīgi dzēsts');
        }),
        catchError(() => {
          this.toastr.error('Neizdevās dzēst attēlu');
          return EMPTY;
        })
      )
      .subscribe();
  }

  onBrowseClick(): void {
    this.fileInput?.nativeElement.click();
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files.length) {
      this.uploadFiles(Array.from(event.dataTransfer.files));
    }
  }
}

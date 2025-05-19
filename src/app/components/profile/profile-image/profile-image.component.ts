import {Component, ElementRef, inject, OnInit, signal, ViewChild, WritableSignal} from '@angular/core';
import {catchError, EMPTY, finalize, tap} from "rxjs";
import {AuthService} from "../../auth/services/auth.service";
import {ProfileService} from "../services/profile.service";
import {ToastrService} from "ngx-toastr";
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";

@Component({
  selector: 'app-profile-image',
  imports: [
    ButtonLoaderDirective
  ],
  templateUrl: './profile-image.component.html',
  styleUrl: './profile-image.component.scss'
})
export class ProfileImageComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  protected readonly isDragging: WritableSignal<boolean> = signal(false);
  protected readonly imagePreview: WritableSignal<string | null> = signal(null);
  protected readonly imageError: WritableSignal<string | null> = signal(null);
  protected readonly isUploading: WritableSignal<boolean> = signal(false);
  protected readonly userInitials: WritableSignal<string> = signal('');
  protected readonly currentUserImage: WritableSignal<string | null> = signal(null);

  private selectedFile: File | null = null;

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.setUserInitials(user.name);

      if (user.profile_image) {
        this.currentUserImage.set(user.profile_image);
        this.imagePreview.set(user.profile_image);
      } else {
        this.currentUserImage.set(null);
        this.imagePreview.set(null);
      }
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
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
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  processFile(file: File): void {
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
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview.set(null);
    this.imageError.set(null);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  cancelUpload(): void {
    this.selectedFile = null;
    this.imagePreview.set(this.currentUserImage());
    this.imageError.set(null);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isUploading.set(true);

    const formData = new FormData();
    formData.append('profile_image', this.selectedFile);

    this.profileService.updateProfileImage(formData)
      .pipe(
        tap(response => {
          this.toastr.success('Profila attēls veiksmīgi atjaunināts');
          if (response.data?.profile_image) {
            this.currentUserImage.set(response.data.profile_image);
            this.authService.updateUserData({
              profile_image: response.data.profile_image
            });
          }
        }),
        catchError(error => {
          this.toastr.error('Neizdevās augšupielādēt attēlu');
          return EMPTY;
        }),
        finalize(() => {
          this.isUploading.set(false);
        })
      )
      .subscribe();
  }

  private setUserInitials(name: string): void {
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      this.userInitials.set(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase());
    } else if (nameParts.length === 1) {
      this.userInitials.set(nameParts[0].substring(0, 2).toUpperCase());
    }
  }

  deleteProfileImage(): void {
    if (!this.currentUserImage()) {
      return;
    }

    this.isUploading.set(true);

    this.profileService.removeProfileImage()
      .pipe(
        tap(response => {
          this.toastr.success('Profila attēls veiksmīgi dzēsts');
          this.currentUserImage.set(null);
          this.imagePreview.set(null);
          this.authService.updateUserData({
            profile_image: null
          });
        }),
        catchError(error => {
          this.toastr.error('Neizdevās dzēst profila attēlu');
          return EMPTY;
        }),
        finalize(() => {
          this.isUploading.set(false);
        })
      )
      .subscribe();
  }
}

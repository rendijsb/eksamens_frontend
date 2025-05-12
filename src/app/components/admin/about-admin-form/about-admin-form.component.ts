import {Component, inject, OnInit, signal, ViewEncapsulation, AfterViewInit, ElementRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import {ValidationErrorDirective} from "../../../shared/directives/validation-error/validation-error.directive";
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";
import {AboutPage, PagesService} from "../../main/service/page.service";
import {AngularEditorConfig, AngularEditorModule} from '@kolkov/angular-editor';

@Component({
  selector: 'app-about-admin-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ValidationErrorDirective,
    ButtonLoaderDirective,
    AngularEditorModule
  ],
  templateUrl: './about-admin-form.component.html',
  styleUrls: ['../styles/admin-page-styles.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AboutAdminFormComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly pagesService = inject(PagesService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly el = inject(ElementRef);

  protected readonly isLoading = signal(false);
  protected readonly isSubmitted = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly aboutPage = signal<AboutPage | null>(null);

  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: 'auto',
    minHeight: '250px',
    maxHeight: 'auto',
    width: 'auto',
    minWidth: '0',
    placeholder: 'Ievadiet lapas saturu...',
    translate: 'no',
    enableToolbar: true,
    showToolbar: true,
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    defaultFontSize: '3',
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      [
        'subscript',
        'superscript',
        'justifyFull',
        'insertImage',
        'insertVideo'
      ],
      [
        'fontSize',
        'textColor',
        'backgroundColor',
        'customClasses',
        'insertHorizontalRule',
      ]
    ]
  };

  aboutForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    content: ['', [Validators.required]],
    is_active: [true],
  });

  ngOnInit(): void {
    const pageId = this.route.snapshot.paramMap.get('id');

    if (pageId) {
      this.isEditMode.set(true);
      this.loadAboutPage(+pageId);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.checkEditorIcons();
    }, 500);
  }

  private checkEditorIcons(): void {
    const editorButtons = this.el.nativeElement.querySelectorAll('.angular-editor-button');
    editorButtons.forEach((button: HTMLElement) => {
      const icon = button.querySelector('i, fa-icon');
      if (!icon || (icon && !icon.innerHTML.trim())) {
        button.innerHTML = '';
      }
    });
  }

  loadAboutPage(id: number): void {
    this.isLoading.set(true);

    this.pagesService.getAboutPageById(id)
      .pipe(
        tap((response) => {
          this.aboutPage.set(response.data);
          this.aboutForm.patchValue({
            title: response.data.title,
            content: response.data.content,
            is_active: response.data.is_active
          });
        }),
        catchError(() => {
          this.toastr.error('Neizdevās ielādēt "Par mums" lapu');
          this.router.navigate(['/admin/pages/about']);
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  submitForm(): void {
    this.isSubmitted.set(true);

    if (this.aboutForm.invalid) {
      this.toastr.warning('Lūdzu, aizpildiet visus obligātos laukus');
      return;
    }

    this.isLoading.set(true);

    const formData = this.aboutForm.value as Partial<AboutPage>;

    if (this.isEditMode() && this.aboutPage()) {
      this.pagesService.updateAboutPage(this.aboutPage()!.id, formData)
        .pipe(
          tap(() => {
            this.toastr.success('"Par mums" lapa veiksmīgi atjaunināta');
            this.router.navigate(['/admin/pages/about']);
          }),
          catchError(() => {
            this.toastr.error('Neizdevās atjaunināt "Par mums" lapu');
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe();
    } else {
      this.pagesService.createAboutPage(formData)
        .pipe(
          tap(() => {
            this.toastr.success('Jauna "Par mums" lapa veiksmīgi izveidota');
            this.router.navigate(['/admin/pages/about']);
          }),
          catchError(() => {
            this.toastr.error('Neizdevās izveidot "Par mums" lapu');
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe();
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/pages/about']);
  }
}

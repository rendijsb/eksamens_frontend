import {Component, inject} from '@angular/core';
import {ReactiveFormsModule, UntypedFormBuilder, Validators} from "@angular/forms";

@Component({
    selector: 'app-register',
  imports: [
    ReactiveFormsModule
  ],
    templateUrl: './register.component.html',
    styleUrl: '../styles/auth.scss'
})
export class RegisterComponent {
  private readonly formBuilder = inject(UntypedFormBuilder);

  registerForm = this.formBuilder.group({
    name: ['', Validators.required],
    email: ['', Validators.required],
    phone: ['', Validators.required],
    password: ['', Validators.required],
    password_confirmation: ['', Validators.required]
  });

  onSubmit() {

  }
}

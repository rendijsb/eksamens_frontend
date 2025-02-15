import {
  Component,
  inject,
  input,
  InputSignal,
  OnInit,
  output,
  OutputEmitterRef,
  signal,
  WritableSignal
} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {RoleEnum, User} from "../../../auth/models/user.models";
import {RegexPatterns} from "../../../../shared/constants/regex.constants";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-form-modal.component.html',
  styleUrl: '../users.component.scss'
})
export class UserFormModalComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);

  user: InputSignal<User | undefined> = input<User | undefined>();
  protected readonly close: OutputEmitterRef<void> = output<void>();
  protected readonly saved: OutputEmitterRef<User> = output<User>();

  protected readonly RoleEnum: typeof RoleEnum = RoleEnum;
  protected isEditing: WritableSignal<boolean> = signal<boolean>(false);

  userForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(RegexPatterns.NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.pattern(RegexPatterns.EMAIL_PATTERN)]],
    phone: ['', [Validators.pattern(RegexPatterns.PHONE_PATTERN)]],
    role: ['', Validators.required]
  });

  ngOnInit(): void {
    this.initialize();
  }

  initialize(): void {
    const userData: User | undefined = this.user();
    this.isEditing.set(!!userData);

    if (userData) {
      this.userForm.patchValue({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role.toString()
      });
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    this.saved.emit(this.userForm.value as unknown as User);
    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}

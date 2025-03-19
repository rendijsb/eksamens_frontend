import {Component, effect, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {User} from "../../../components/auth/models/user.models";
import {AuthService} from "../../../components/auth/services/auth.service";
import {RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-profile-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './profile-layout.component.html',
  styleUrl: './profile-layout.component.scss'
})
export class ProfileLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  protected readonly user: WritableSignal<User | null> = signal(null);

  constructor() {
    effect(() => {
      const currentUser = this.authService.user();

      if (currentUser) {
        this.user.set(currentUser);
      }
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    const userData = this.authService.user();
    this.user.set(userData);
  }

  getUserInitials(): string {
    if (!this.user()) return '';

    const nameParts = this.user()!.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }

    return nameParts[0].substring(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}

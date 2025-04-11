import {Component, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {AuthService} from "./components/auth/services/auth.service";
import {filter} from "rxjs";

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService)

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.authService.checkAuthStatus();
    });
  }

  ngOnInit() {
    this.authService.checkAuthStatus();
  }

  title = 'eksamens_frontend';
}

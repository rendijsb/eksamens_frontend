import { Component } from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {FooterComponent} from "../../footer/footer.component";
import {HeaderComponent} from "../../header/header.component";

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    FooterComponent,
    HeaderComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {

}

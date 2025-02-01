import { Component } from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {FooterComponent} from "../../main/footer/footer.component";
import {HeaderComponent} from "../../main/header/header.component";

@Component({
    selector: 'app-main-layout',
    imports: [
        RouterOutlet,
        FooterComponent,
        HeaderComponent,
    ],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {

}

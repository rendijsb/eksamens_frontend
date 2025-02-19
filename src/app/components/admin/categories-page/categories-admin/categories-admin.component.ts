import {Component, inject} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-categories-admin',
  imports: [],
  templateUrl: './categories-admin.component.html',
  styleUrl: '../../styles/data-table-styles.scss'
})
export class CategoriesAdminComponent {
  private readonly router: Router = inject(Router);

  createOrEdit(categoryId?: number): void {
    if (categoryId) {
      this.router.navigate(['/admin/categories', categoryId, 'edit']);
    } else {
      this.router.navigate(['/admin/categories/create']);
    }
  }
}

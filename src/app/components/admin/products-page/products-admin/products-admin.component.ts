import {Component, signal} from '@angular/core';
import {
  ProductImagesAdminComponent
} from "../../product-images-page/product-images-admin/product-images-admin.component";

@Component({
  selector: 'app-products-admin',
  imports: [
    ProductImagesAdminComponent
  ],
  templateUrl: './products-admin.component.html',
  styleUrl: '../../styles/data-table-styles.scss'
})
export class ProductsAdminComponent {
  showImageModal = signal(false);
  selectedProductId = signal<number | null>(null);

  openImageModal(productId: number) {
    this.selectedProductId.set(productId);
    this.showImageModal.set(true);
  }
}

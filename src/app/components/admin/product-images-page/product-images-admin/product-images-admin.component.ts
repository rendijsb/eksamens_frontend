import {Component, input, InputSignal, output, OutputEmitterRef} from '@angular/core';

@Component({
  selector: 'app-product-images-admin',
  imports: [],
  templateUrl: './product-images-admin.component.html',
  styleUrl: './product-images-admin.component.scss'
})
export class ProductImagesAdminComponent {
  productId: InputSignal<number> = input.required<number>();
  close: OutputEmitterRef<void> = output<void>();
}

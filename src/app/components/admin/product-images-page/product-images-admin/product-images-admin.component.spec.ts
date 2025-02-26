import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductImagesAdminComponent } from './product-images-admin.component';

describe('ProductImagesAdminComponent', () => {
  let component: ProductImagesAdminComponent;
  let fixture: ComponentFixture<ProductImagesAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductImagesAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductImagesAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

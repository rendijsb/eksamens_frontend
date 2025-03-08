import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsAdminFormComponent } from './products-admin-form.component';

describe('ProductsAdminFormComponent', () => {
  let component: ProductsAdminFormComponent;
  let fixture: ComponentFixture<ProductsAdminFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsAdminFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsAdminFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

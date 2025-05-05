import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDetailsAdminComponent } from './order-details-admin.component';

describe('OrderDetailsAdminComponent', () => {
  let component: OrderDetailsAdminComponent;
  let fixture: ComponentFixture<OrderDetailsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderDetailsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

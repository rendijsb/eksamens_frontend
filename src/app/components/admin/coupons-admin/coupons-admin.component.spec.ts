import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CouponsAdminComponent } from './coupons-admin.component';

describe('CouponsAdminComponent', () => {
  let component: CouponsAdminComponent;
  let fixture: ComponentFixture<CouponsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CouponsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CouponsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

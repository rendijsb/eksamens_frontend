import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CouponsFormComponent } from './coupons-form.component';

describe('CouponsFormComponent', () => {
  let component: CouponsFormComponent;
  let fixture: ComponentFixture<CouponsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CouponsFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CouponsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

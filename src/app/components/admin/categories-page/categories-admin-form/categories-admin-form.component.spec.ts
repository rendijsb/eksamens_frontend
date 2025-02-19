import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriesAdminFormComponent } from './categories-admin-form.component';

describe('CategoriesAdminFormComponent', () => {
  let component: CategoriesAdminFormComponent;
  let fixture: ComponentFixture<CategoriesAdminFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesAdminFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriesAdminFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

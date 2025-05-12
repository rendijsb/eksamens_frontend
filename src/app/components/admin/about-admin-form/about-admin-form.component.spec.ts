import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutAdminFormComponent } from './about-admin-form.component';

describe('AboutAdminFormComponent', () => {
  let component: AboutAdminFormComponent;
  let fixture: ComponentFixture<AboutAdminFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutAdminFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutAdminFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

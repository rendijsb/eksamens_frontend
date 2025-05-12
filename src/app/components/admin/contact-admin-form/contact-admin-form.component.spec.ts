import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactAdminFormComponent } from './contact-admin-form.component';

describe('ContactAdminFormComponent', () => {
  let component: ContactAdminFormComponent;
  let fixture: ComponentFixture<ContactAdminFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactAdminFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactAdminFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

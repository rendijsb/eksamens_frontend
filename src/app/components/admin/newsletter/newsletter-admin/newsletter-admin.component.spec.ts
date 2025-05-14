import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsletterAdminComponent } from './newsletter-admin.component';

describe('NewsletterAdminComponent', () => {
  let component: NewsletterAdminComponent;
  let fixture: ComponentFixture<NewsletterAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsletterAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsletterAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

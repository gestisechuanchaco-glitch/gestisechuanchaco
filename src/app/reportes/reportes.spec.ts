import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Repotes } from './repotes';

describe('Repotes', () => {
  let component: Repotes;
  let fixture: ComponentFixture<Repotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Repotes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Repotes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

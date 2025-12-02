import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fiscalizacion } from './fiscalizacion';

describe('Fiscalizacion', () => {
  let component: Fiscalizacion;
  let fixture: ComponentFixture<Fiscalizacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fiscalizacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fiscalizacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inspecciones } from './inspecciones';

describe('Inspecciones', () => {
  let component: Inspecciones;
  let fixture: ComponentFixture<Inspecciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inspecciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inspecciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

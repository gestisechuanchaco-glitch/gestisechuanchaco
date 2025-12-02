import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialInspeccionesComponent } from './historial-inspecciones';

describe('HistorialInspeccionesComponent', () => {
  let component: HistorialInspeccionesComponent;
  let fixture: ComponentFixture<HistorialInspeccionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialInspeccionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistorialInspeccionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});










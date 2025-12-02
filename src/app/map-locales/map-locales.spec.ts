import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapLocales } from './map-locales';

describe('MapLocales', () => {
  let component: MapLocales;
  let fixture: ComponentFixture<MapLocales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapLocales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapLocales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

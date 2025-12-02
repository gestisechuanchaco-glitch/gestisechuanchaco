import { Component, AfterViewInit } from '@angular/core';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

@Component({
  selector: 'app-map-locales',
  templateUrl: './map-locales.html',
  styleUrls: ['./map-locales.css'],
  standalone: true
})
export class MapLocalesComponent implements AfterViewInit {

  ngAfterViewInit() {
    this.loadGoogleMaps(() => {
      // Centro de Huanchaco (puedes cambiarlo si quieres otro lugar)
      const center = { lat: -7.944536, lng: -79.145630 };

      // Inicializa el mapa de manera normal, sin restricciones
      new window.google.maps.Map(
        document.getElementById('map-locales') as HTMLElement,
        {
          center,
          zoom: 14
        }
      );
    });
  }

  loadGoogleMaps(callback: () => void) {
    const existingScript = document.getElementById('googleMapsScript');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'googleMapsScript';
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDYNYcGvDFqLEXafXfP45G5ApLdvgdbm_o&callback=initMap';
      script.async = true;
      window.initMap = callback;
      document.body.appendChild(script);
    } else {
      callback();
    }
  }
}
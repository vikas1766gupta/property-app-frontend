import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Property } from '../../shared/models/property.model';

export interface MapCenterSelection {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #mapElement class="property-map" role="application" aria-label="Property map. Click to choose a radius search center."></div>
    <p class="map-caption">{{ propertiesWithCoordinates }} mapped properties. Select a point to search within {{ radiusKm }} km.</p>
  `,
  styleUrl: './property-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapElement') private readonly mapElement?: ElementRef<HTMLDivElement>;
  @Input() properties: Property[] = [];
  @Input() radiusKm = 10;
  @Input() selectedCenter: MapCenterSelection | null = null;
  @Output() readonly centerSelected = new EventEmitter<MapCenterSelection>();

  private map?: L.Map;
  private markers?: L.MarkerClusterGroup;
  private radiusCircle?: L.Circle;
  private centerMarker?: L.CircleMarker;
  private hasFramedListings = false;

  get propertiesWithCoordinates(): number {
    return this.properties.filter((property) => property.latitude != null && property.longitude != null).length;
  }

  ngAfterViewInit(): void {
    if (!this.mapElement) return;
    this.map = L.map(this.mapElement.nativeElement, { scrollWheelZoom: false }).setView([20.5937, 78.9629], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    this.markers = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 52 });
    this.map.addLayer(this.markers);
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.centerSelected.emit({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    });
    this.renderMarkers();
    this.map.invalidateSize();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.map) this.renderMarkers();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private renderMarkers(): void {
    if (!this.map || !this.markers) return;
    this.markers.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    for (const property of this.properties) {
      if (property.latitude == null || property.longitude == null) continue;
      const position: L.LatLngExpression = [property.latitude, property.longitude];
      const marker = L.marker(position, {
        icon: L.divIcon({ className: 'property-pin', html: '<span></span>', iconSize: [26, 34], iconAnchor: [13, 32] }),
      });
      const popup = document.createElement('a');
      popup.className = 'property-map-popup';
      popup.href = `/properties/${encodeURIComponent(property.id)}`;
      const title = document.createElement('strong');
      title.textContent = property.title;
      const price = document.createElement('span');
      price.textContent = `${property.currency} ${property.price.toLocaleString()}`;
      popup.append(title, price);
      marker.bindPopup(popup);
      this.markers.addLayer(marker);
      bounds.push(position);
    }

    this.radiusCircle?.remove();
    this.centerMarker?.remove();
    this.radiusCircle = undefined;
    this.centerMarker = undefined;
    if (this.selectedCenter) {
      const center: L.LatLngExpression = [this.selectedCenter.latitude, this.selectedCenter.longitude];
      this.radiusCircle = L.circle(center, {
        radius: this.radiusKm * 1000,
        color: '#176b52',
        weight: 2,
        fillColor: '#176b52',
        fillOpacity: 0.1,
      }).addTo(this.map);
      this.centerMarker = L.circleMarker(center, { radius: 5, color: '#ffffff', weight: 2, fillColor: '#c85d47', fillOpacity: 1 }).addTo(this.map);
    }

    if (!this.hasFramedListings && bounds.length) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24], maxZoom: 13 });
      this.hasFramedListings = true;
    }
  }
}
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import * as L from "leaflet";
import { UiButtonDirective } from "../../shared/ui/button.directive";

export interface PickedLocation {
  latitude: number;
  longitude: number;
}

/** Single-marker Leaflet picker used by the listing form to set a property's map coordinates. */
@Component({
  selector: "app-location-picker",
  standalone: true,
  imports: [CommonModule, UiButtonDirective],
  template: `
    <div class="location-picker">
      <div
        #mapElement
        class="location-picker-map"
        role="application"
        aria-label="Listing location map. Click to set the property's position."
      ></div>
      <div class="location-picker-actions">
        <button uiButton type="button" (click)="useCurrentLocation()">
          Use my current location
        </button>
        <button
          uiButton="quiet"
          type="button"
          *ngIf="latitude != null"
          (click)="clearLocation()"
        >
          Clear location
        </button>
      </div>
      <p class="location-picker-hint" *ngIf="latitude == null">
        Click the map, or use your current location, to pin this property so it
        appears in map search and radius results.
      </p>
      <p class="location-picker-hint" *ngIf="latitude != null">
        {{ latitude | number: "1.5-5" }}, {{ longitude | number: "1.5-5" }}
      </p>
      <p class="location-picker-error" *ngIf="geolocationError" role="alert">
        {{ geolocationError }}
      </p>
    </div>
  `,
  styleUrl: "./location-picker.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationPickerComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild("mapElement")
  private readonly mapElement?: ElementRef<HTMLDivElement>;
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Output() readonly locationChange = new EventEmitter<PickedLocation | null>();

  geolocationError: string | null = null;

  private map?: L.Map;
  private marker?: L.Marker;
  private viewInitialized = false;

  ngAfterViewInit(): void {
    if (!this.mapElement) return;
    const hasPosition = this.latitude != null && this.longitude != null;
    const startCenter: L.LatLngExpression = hasPosition
      ? [this.latitude!, this.longitude!]
      : [20.5937, 78.9629];

    this.map = L.map(this.mapElement.nativeElement, {
      scrollWheelZoom: false,
    }).setView(startCenter, hasPosition ? 14 : 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.map);

    this.map.on("click", (event: L.LeafletMouseEvent) =>
      this.setPosition(event.latlng.lat, event.latlng.lng),
    );

    this.viewInitialized = true;
    this.syncMarker();
    this.map.invalidateSize();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.viewInitialized) this.syncMarker();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  useCurrentLocation(): void {
    this.geolocationError = null;
    if (!("geolocation" in navigator)) {
      this.geolocationError =
        "Location services are not available in this browser.";
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setPosition(position.coords.latitude, position.coords.longitude);
        this.map?.setView(
          [position.coords.latitude, position.coords.longitude],
          15,
        );
      },
      () => {
        this.geolocationError =
          "Could not read your current location. Choose a point on the map instead.";
      },
      { timeout: 8000 },
    );
  }

  clearLocation(): void {
    this.marker?.remove();
    this.marker = undefined;
    this.locationChange.emit(null);
  }

  private setPosition(latitude: number, longitude: number): void {
    this.locationChange.emit({ latitude, longitude });
  }

  private syncMarker(): void {
    if (!this.map) return;
    if (this.latitude == null || this.longitude == null) {
      this.marker?.remove();
      this.marker = undefined;
      return;
    }

    const position: L.LatLngExpression = [this.latitude, this.longitude];
    if (this.marker) {
      this.marker.setLatLng(position);
      return;
    }

    this.marker = L.marker(position, { draggable: true }).addTo(this.map);
    this.marker.on("dragend", () => {
      const latLng = this.marker!.getLatLng();
      this.setPosition(latLng.lat, latLng.lng);
    });
  }
}

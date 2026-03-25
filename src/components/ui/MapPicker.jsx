import React, { useEffect, useRef, useState } from "react";

/**
 * MapPicker Component - Fixed version (No Refresh on Search)
 */
const MapPicker = ({ lat, lng, onLocationSelect }) => {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Helper to reverse geocode
  const getAddress = (latitude, longitude) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
        if (status === "OK" && results[0]) {
            const formattedAddress = results[0].formatted_address;
            
            // Sync Search Input with Address
            if (searchInputRef.current) {
                searchInputRef.current.value = formattedAddress;
            }

            onLocationSelect?.({ 
                lat: latitude, 
                lng: longitude, 
                address: formattedAddress 
            });
        } else {
            onLocationSelect?.({ lat: latitude, lng: longitude });
        }
    });
  };

  useEffect(() => {
    if (!window.google || googleMapRef.current) return;

    const initialPos = { 
      lat: parseFloat(lat) || 20.5937, 
      lng: parseFloat(lng) || 78.9629 
    };

    // Initialize Map ONLY ONCE
    const map = new window.google.maps.Map(mapRef.current, {
      center: initialPos,
      zoom: lat ? 15 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    googleMapRef.current = map;

    // Initialize Marker
    const marker = new window.google.maps.Marker({
      position: initialPos,
      map: map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });
    markerRef.current = marker;
    setIsLoaded(true);

    // CLICK ON MAP
    map.addListener("click", (e) => {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      marker.setPosition(newPos);
      getAddress(newPos.lat, newPos.lng);
    });

    // DRAG MARKER
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      const newPos = { lat: pos.lat(), lng: pos.lng() };
      getAddress(newPos.lat, newPos.lng);
    });

    // SEARCH PLACES
    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current);
    autocomplete.bindTo("bounds", map);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }
      
      const newPos = { 
        lat: place.geometry.location.lat(), 
        lng: place.geometry.location.lng() 
      };
      marker.setPosition(newPos);
      onLocationSelect?.({ ...newPos, address: place.formatted_address });
    });

  }, []); // Empty dependency ensures it runs only once

  const handleCurrentLocation = () => {
      if (navigator.geolocation && googleMapRef.current && markerRef.current) {
          navigator.geolocation.getCurrentPosition((position) => {
              const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
              };
              googleMapRef.current.setCenter(pos);
              googleMapRef.current.setZoom(16);
              markerRef.current.setPosition(pos);
              getAddress(pos.lat, pos.lng);
          });
      }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
          <div className="relative flex-1">
             <input
               ref={searchInputRef}
               type="text"
               placeholder="Search location (City, Area, Address)..."
               className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 shadow-sm transition-all"
             />
          </div>
          <button 
            type="button"
            onClick={handleCurrentLocation}
            className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
              Use My Location
          </button>
      </div>

      <div 
        ref={mapRef} 
        className="w-full h-80 rounded-2xl border-2 border-slate-100 shadow-inner bg-slate-50 overflow-hidden"
      ></div>
      
      {!isLoaded && <div className="text-xs text-slate-400 animate-pulse">Initializing Google Maps...</div>}
      
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
          💡 TIP: You can click anywhere on the map or drag the red marker for exact location.
      </p>
    </div>
  );
};

export default MapPicker;

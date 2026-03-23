import { useState, useEffect, useRef, useCallback } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDLQT29DB2Lt7yxkCTzEG5LCYk4V8zOB14';

// Load Google Maps script dynamically
const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }
    
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=pt-BR`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Place type mapping for icons
const placeTypeIcons = {
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍺',
  lodging: '🏨',
  museum: '🏛️',
  park: '🌳',
  tourist_attraction: '📸',
  shopping_mall: '🛍️',
  store: '🏪',
  spa: '💆',
  gym: '🏋️',
  night_club: '🎉',
  movie_theater: '🎬',
  stadium: '🏟️',
  airport: '✈️',
  train_station: '🚂',
  bus_station: '🚌',
  default: '📍'
};

const getPlaceIcon = (types) => {
  if (!types || types.length === 0) return placeTypeIcons.default;
  for (const type of types) {
    if (placeTypeIcons[type]) return placeTypeIcons[type];
  }
  return placeTypeIcons.default;
};

// Rating stars display
const RatingStars = ({ rating }) => {
  if (!rating) return null;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-1">
      <span className="text-yellow-400 text-xs">
        {'★'.repeat(fullStars)}
        {hasHalf && '½'}
        {'☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0))}
      </span>
      <span className="text-[#9ca3af] text-xs">({rating.toFixed(1)})</span>
    </div>
  );
};

// Price level display
const PriceLevel = ({ level }) => {
  if (level === undefined || level === null) return null;
  const prices = ['Grátis', '$', '$$', '$$$', '$$$$'];
  const colors = ['text-green-400', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
  return (
    <span className={`text-xs ${colors[level] || 'text-[#6b7280]'}`}>
      {prices[level] || ''}
    </span>
  );
};

// Place card component
function PlaceCard({ place, onSelect, isSelected, accentColor }) {
  const icon = getPlaceIcon(place.types);
  
  return (
    <div 
      onClick={() => onSelect(place)}
      className={`p-3 rounded-xl cursor-pointer transition-all border ${
        isSelected ? 'ring-2' : 'hover:border-[#374151]'
      }`}
      style={{ 
        background: isSelected ? `${accentColor}15` : 'var(--bg-inner)',
        borderColor: isSelected ? accentColor : 'var(--bg-border)',
        ringColor: accentColor
      }}
      data-testid={`place-card-${place.place_id}`}
    >
      <div className="flex gap-3">
        {/* Photo */}
        {place.photo_url ? (
          <img 
            src={place.photo_url} 
            alt={place.name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'var(--bg-card)' }}>
            {icon}
          </div>
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white text-sm font-medium truncate">{place.name}</h4>
          
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={place.rating} />
            <PriceLevel level={place.price_level} />
          </div>
          
          {place.vicinity && (
            <p className="text-[#6b7280] text-xs mt-1 truncate">{place.vicinity}</p>
          )}
          
          {place.opening_hours && (
            <p className={`text-xs mt-1 ${place.opening_hours.open_now ? 'text-green-400' : 'text-red-400'}`}>
              {place.opening_hours.open_now ? '✓ Aberto agora' : '✗ Fechado'}
            </p>
          )}
        </div>
        
        {/* Select indicator */}
        {isSelected && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ background: accentColor, color: '#000' }}>
            ✓
          </div>
        )}
      </div>
    </div>
  );
}

// Mini map component
function MiniMap({ places, selectedPlace, center, accentColor }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  
  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    
    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: center || { lat: -23.5505, lng: -46.6333 }, // Default: São Paulo
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] }
        ],
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative'
      });
    }
    
    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    
    // Add markers for places
    places.forEach((place, index) => {
      if (!place.geometry?.location) return;
      
      const isSelected = selectedPlace?.place_id === place.place_id;
      const marker = new window.google.maps.Marker({
        position: place.geometry.location,
        map: mapInstanceRef.current,
        title: place.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 12 : 8,
          fillColor: isSelected ? accentColor : '#6b7280',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        },
        label: isSelected ? {
          text: (index + 1).toString(),
          color: '#000',
          fontSize: '10px',
          fontWeight: 'bold'
        } : null
      });
      
      marker.addListener('click', () => {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="color:#000;padding:4px"><strong>${place.name}</strong><br><small>${place.vicinity || ''}</small></div>`
        });
        infoWindow.open(mapInstanceRef.current, marker);
      });
      
      markersRef.current.push(marker);
    });
    
    // Fit bounds to show all markers
    if (places.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      places.forEach(place => {
        if (place.geometry?.location) {
          bounds.extend(place.geometry.location);
        }
      });
      mapInstanceRef.current.fitBounds(bounds);
      
      // Don't zoom in too much
      const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current.getZoom() > 16) {
          mapInstanceRef.current.setZoom(16);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
    
    // Center on selected place
    if (selectedPlace?.geometry?.location) {
      mapInstanceRef.current.panTo(selectedPlace.geometry.location);
    }
    
  }, [places, selectedPlace, center, accentColor]);
  
  return (
    <div 
      ref={mapRef} 
      className="w-full h-48 rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--bg-border)' }}
      data-testid="mini-map"
    />
  );
}

// Main PlaceSearch component
export default function PlaceSearch({ 
  location, 
  onSelectPlace, 
  onAddToItinerary,
  selectedDate,
  accentColor = '#22c55e' 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('restaurant');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [activityTime, setActivityTime] = useState('12:00');
  
  const searchBoxRef = useRef(null);
  const placesServiceRef = useRef(null);
  
  // Load Google Maps
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setIsLoaded(true))
      .catch(err => console.error('Error loading Google Maps:', err));
  }, []);
  
  // Initialize Places service
  useEffect(() => {
    if (!isLoaded || !window.google) return;
    
    // Create a dummy div for PlacesService
    const div = document.createElement('div');
    placesServiceRef.current = new window.google.maps.places.PlacesService(div);
    
    // Geocode location to get center
    if (location) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setMapCenter(results[0].geometry.location.toJSON());
        }
      });
    }
  }, [isLoaded, location]);
  
  // Search places
  const searchPlaces = useCallback(() => {
    if (!placesServiceRef.current || !mapCenter) return;
    
    setIsSearching(true);
    setPlaces([]);
    
    const request = {
      location: mapCenter,
      radius: 5000, // 5km
      type: searchType,
      keyword: searchQuery || undefined
    };
    
    placesServiceRef.current.nearbySearch(request, (results, status) => {
      setIsSearching(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // Add photo URLs
        const placesWithPhotos = results.slice(0, 10).map(place => ({
          ...place,
          photo_url: place.photos?.[0]?.getUrl({ maxWidth: 200, maxHeight: 200 })
        }));
        setPlaces(placesWithPhotos);
      }
    });
  }, [mapCenter, searchType, searchQuery]);
  
  // Auto-search when location changes
  useEffect(() => {
    if (mapCenter && isLoaded) {
      searchPlaces();
    }
  }, [mapCenter, isLoaded]);
  
  // Handle place selection
  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    if (onSelectPlace) onSelectPlace(place);
  };
  
  // Handle add to itinerary
  const handleAddToItinerary = () => {
    if (!selectedPlace) return;
    setShowTimeModal(true);
  };
  
  const confirmAddToItinerary = () => {
    if (!selectedPlace || !onAddToItinerary) return;
    
    onAddToItinerary({
      time: activityTime,
      title: selectedPlace.name,
      notes: selectedPlace.vicinity || '',
      place_id: selectedPlace.place_id,
      location: selectedPlace.geometry?.location?.toJSON?.() || null,
      rating: selectedPlace.rating,
      photo_url: selectedPlace.photo_url
    });
    
    setShowTimeModal(false);
    setSelectedPlace(null);
    setActivityTime('12:00');
  };
  
  // Open in Google Maps
  const openInGoogleMaps = (place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    window.open(url, '_blank');
  };
  
  const searchTypes = [
    { id: 'restaurant', label: 'Restaurantes', icon: '🍽️' },
    { id: 'cafe', label: 'Cafés', icon: '☕' },
    { id: 'tourist_attraction', label: 'Atrações', icon: '📸' },
    { id: 'museum', label: 'Museus', icon: '🏛️' },
    { id: 'park', label: 'Parques', icon: '🌳' },
    { id: 'shopping_mall', label: 'Shopping', icon: '🛍️' },
    { id: 'lodging', label: 'Hotéis', icon: '🏨' },
    { id: 'bar', label: 'Bares', icon: '🍺' }
  ];
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: `${accentColor} transparent ${accentColor} ${accentColor}` }} />
      </div>
    );
  }
  
  return (
    <div className="space-y-4" data-testid="place-search">
      {/* Search Header */}
      <div className="space-y-3">
        {/* Location indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#6b7280]">📍 Buscando em:</span>
          <span className="text-white font-medium">{location || 'Localização não definida'}</span>
        </div>
        
        {/* Search input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchPlaces()}
            placeholder="Buscar por nome..."
            className="flex-1 bg-transparent text-white placeholder-[#4b5563] rounded-xl px-4 py-2.5 outline-none border text-sm"
            style={{ borderColor: 'var(--bg-border)' }}
            data-testid="place-search-input"
          />
          <button
            onClick={searchPlaces}
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: accentColor, color: '#000' }}
            data-testid="place-search-button"
          >
            {isSearching ? '...' : '🔍'}
          </button>
        </div>
        
        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {searchTypes.map(type => (
            <button
              key={type.id}
              onClick={() => {
                setSearchType(type.id);
                setTimeout(searchPlaces, 100);
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                searchType === type.id ? 'border-transparent' : ''
              }`}
              style={{ 
                background: searchType === type.id ? accentColor : 'var(--bg-inner)',
                color: searchType === type.id ? '#000' : '#9ca3af',
                borderColor: searchType === type.id ? 'transparent' : 'var(--bg-border)'
              }}
              data-testid={`place-type-${type.id}`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Mini Map */}
      {places.length > 0 && (
        <MiniMap 
          places={places} 
          selectedPlace={selectedPlace} 
          center={mapCenter}
          accentColor={accentColor}
        />
      )}
      
      {/* Results */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full"
              style={{ borderColor: `${accentColor} transparent ${accentColor} ${accentColor}` }} />
            <span className="ml-3 text-[#6b7280] text-sm">Buscando lugares...</span>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-8 text-[#6b7280] text-sm">
            Nenhum lugar encontrado. Tente outra busca.
          </div>
        ) : (
          places.map(place => (
            <PlaceCard 
              key={place.place_id} 
              place={place} 
              onSelect={handleSelectPlace}
              isSelected={selectedPlace?.place_id === place.place_id}
              accentColor={accentColor}
            />
          ))
        )}
      </div>
      
      {/* Selected Place Actions */}
      {selectedPlace && (
        <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--bg-border)' }}>
          <button
            onClick={() => openInGoogleMaps(selectedPlace)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border"
            style={{ borderColor: 'var(--bg-border)', color: '#9ca3af' }}
            data-testid="open-in-maps-button"
          >
            🗺️ Ver no Maps
          </button>
          <button
            onClick={handleAddToItinerary}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            style={{ background: accentColor, color: '#000' }}
            data-testid="add-to-itinerary-button"
          >
            ➕ Adicionar ao Roteiro
          </button>
        </div>
      )}
      
      {/* Time Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowTimeModal(false)} />
          <div className="relative w-full max-w-sm mx-4 p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
            <h3 className="text-white font-bold text-lg mb-4">Adicionar ao Roteiro</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[#6b7280] text-sm mb-2 block">Local selecionado:</label>
                <p className="text-white font-medium">{selectedPlace?.name}</p>
                {selectedPlace?.vicinity && (
                  <p className="text-[#6b7280] text-xs mt-1">{selectedPlace.vicinity}</p>
                )}
              </div>
              
              <div>
                <label className="text-[#6b7280] text-sm mb-2 block">Data:</label>
                <p className="text-white">{selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { 
                  weekday: 'long', day: 'numeric', month: 'long' 
                }) : 'Selecione uma data'}</p>
              </div>
              
              <div>
                <label className="text-[#6b7280] text-sm mb-2 block">Horário:</label>
                <input
                  type="time"
                  value={activityTime}
                  onChange={e => setActivityTime(e.target.value)}
                  className="w-full bg-transparent text-white rounded-xl px-4 py-2.5 outline-none border text-lg"
                  style={{ borderColor: 'var(--bg-border)' }}
                  data-testid="activity-time-input"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTimeModal(false)}
                className="flex-1 py-3 rounded-xl text-[#6b7280] text-sm font-medium border"
                style={{ borderColor: 'var(--bg-border)' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmAddToItinerary}
                disabled={!selectedDate}
                className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: accentColor, color: '#000' }}
                data-testid="confirm-add-button"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

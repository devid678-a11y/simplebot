import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { API_BASE } from '../apiConfig'

// Токен из AndroidManifest (лучше вынести в .env, но для простоты пока здесь)
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || 'pk.eyJ1IjoiZGV2aWQ2NzgiLCJhIjoiY21jM3A5bmd4MDMyaDJvcXY4emRwMmxnMiJ9.TL4w0VihB4fVY9cdUYxqMg';

export default function Map({ events }: { events?: any[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<{ [id: string]: mapboxgl.Marker }>({})
  const [lng, setLng] = useState(37.6176)
  const [lat, setLat] = useState(55.7558)
  const [zoom, setZoom] = useState(10)
  const [error, setError] = useState<string | null>(null)

  // Обновляем данные карты при изменении пропса events
  useEffect(() => {
    if (!map.current || !map.current.getSource('events') || !events) return;
    updateSource(events);
  }, [events]);

  const updateSource = (data: any[]) => {
    if (!map.current) return;
    const features = data
      .filter((e: any) => e.geo && e.geo.lat && e.geo.lng)
      .map((e: any) => ({
          type: 'Feature',
          geometry: {
              type: 'Point',
              coordinates: [e.geo.lng || e.geo.lon, e.geo.lat]
          },
          properties: {
              id: e.id,
              title: e.title,
              description: e.description,
              date: e.startAtMillis ? new Date(e.startAtMillis).toLocaleDateString() : '',
              category: Array.isArray(e.categories) ? e.categories[0] : 'Event',
              image: Array.isArray(e.imageUrls) && e.imageUrls.length > 0 ? e.imageUrls[0] : null
          }
      }));

    const geojson = {
        type: 'FeatureCollection',
        features: features
    };

    const source = map.current.getSource('events') as mapboxgl.GeoJSONSource;
    if (source) {
        source.setData(geojson as any);
        setTimeout(updateMarkers, 100);
    }
  };

  useEffect(() => {
    if (map.current) return
    if (!mapContainer.current) return

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [lng, lat],
        zoom: zoom
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Ошибка загрузки карты: ' + (e.error?.message || 'Unknown error'));
      });


      map.current.on('move', () => {
        if (!map.current) return
        setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
        setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
        setZoom(parseFloat(map.current.getZoom().toFixed(2)));
        updateMarkers()
      });

      map.current.on('moveend', updateMarkers);

      map.current.on('load', () => {
        if (events) {
          loadEventsFromProps(events);
        } else {
          loadEvents();
        }
      });

      // Клик по кластеру - зум
      map.current.on('click', 'clusters', (e) => {
          const features = map.current?.queryRenderedFeatures(e.point, {
              layers: ['clusters']
          });
          if (!features || !features.length) return;
          
          const clusterId = features[0].properties?.cluster_id;
          (map.current?.getSource('events') as any).getClusterExpansionZoom(
              clusterId,
              (err: any, zoom: number) => {
                  if (err) return;
                  
                  map.current?.easeTo({
                      center: (features[0].geometry as any).coordinates,
                      zoom: zoom
                  });
              }
          );
      });
      
      // Курсор
      map.current.on('mouseenter', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
      });

    } catch (e) {
      console.error('Mapbox init error:', e);
      setError('Ошибка инициализации карты: ' + (e as any).message);
    }
    
    return () => {
        map.current?.remove()
        map.current = null
    }

  }, []);

  const updateMarkers = () => {
      if (!map.current) return;
      if (!map.current.getSource('events')) return;

      // Получаем все некластеризованные точки в текущем view
      const features = map.current.querySourceFeatures('events', {
          filter: ['!', ['has', 'point_count']]
      });
      
      const currentIds = new Set<string>();
      
      features.forEach((f: any) => {
          const id = f.properties.id;
          currentIds.add(id);
          
          if (!markers.current[id]) {
              // Создаем маркер
              const el = document.createElement('div');
              el.className = 'marker';
              
              // Стиль маркера
              const img = f.properties.image;
              const emoji = f.properties.emoji || '📍';
              
              el.style.width = '40px';
              el.style.height = '40px';
              el.style.borderRadius = '50%';
              el.style.border = '2px solid #fff';
              el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              el.style.cursor = 'pointer';
              el.style.backgroundSize = 'cover';
              el.style.backgroundPosition = 'center';
              el.style.backgroundColor = '#00E5FF'; // Fallback color
              
              if (img) {
                  el.style.backgroundImage = `url(${img})`;
              } else {
                  el.style.display = 'flex';
                  el.style.alignItems = 'center';
                  el.style.justifyContent = 'center';
                  el.style.fontSize = '20px';
                  el.innerHTML = emoji;
              }

              // Popup
              const { title, date, description } = f.properties;
              const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                  <div style="color: black; padding: 5px; min-width: 150px;">
                      ${img ? `<div style="width:100%; height:100px; background:url(${img}) center/cover; border-radius: 4px; margin-bottom: 8px;"></div>` : ''}
                      <h3 style="font-weight: bold; margin-bottom: 5px;">${title}</h3>
                      <p style="font-size: 12px; color: gray; margin-bottom: 4px;">${date}</p>
                      <p>${description ? description.substring(0, 50) + '...' : ''}</p>
                  </div>
              `);

              const marker = new mapboxgl.Marker({ element: el })
                  .setLngLat(f.geometry.coordinates)
                  .setPopup(popup)
                  .addTo(map.current!);
                  
              markers.current[id] = marker;
          }
      });
      
      // Удаляем маркеры, которые ушли из view или кластеризовались
      Object.keys(markers.current).forEach(id => {
          if (!currentIds.has(id)) {
              markers.current[id].remove();
              delete markers.current[id];
          }
      });
  }

  const loadEventsFromProps = (data: any[]) => {
      if (!map.current) return;
      
      // Создаем source и слои (пустые, данные зальем через updateSource)
      map.current.addSource('events', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] } as any,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
      });

      setupLayers();
      updateSource(data);
  };

  const setupLayers = () => {
      if (!map.current) return;
      
      // Слой кружков кластеров
      map.current.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'events',
          filter: ['has', 'point_count'],
          paint: {
              'circle-color': '#51bbd6',
              'circle-radius': 20
          }
      });

      map.current.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'events',
          filter: ['has', 'point_count'],
          layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12
          }
      });
  };

  const loadEvents = async () => {
      if (!map.current) return;

      try {
          // Загружаем события с API
          const response = await fetch(`${API_BASE}/api/events?limit=500`);
          const events = await response.json();

          map.current.addSource('events', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] } as any,
              cluster: true,
              clusterMaxZoom: 14,
              clusterRadius: 50
          });
          setupLayers();
          updateSource(events);
          
      } catch (e) {
          console.error('Ошибка загрузки событий:', e);
      }
  };

  return (
    <div className="w-full h-full relative" style={{ minHeight: '400px', background: '#1a1a1a' }}>
        {error && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'red', zIndex: 10, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

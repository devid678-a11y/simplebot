import { useEffect, useRef } from 'react'
// Map uses API for events now
import { db } from '../firebase'

export default function Map() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const provider = (import.meta.env.VITE_MAP_PROVIDER as string) || 'mapbox'
    let map: any
    let mapboxgl: any
    let isLoaded = false
    let lastGeojson: any = { type: 'FeatureCollection', features: [] }
    // Яндекс провайдер
    let ymaps3: any
    let ymap: any
    let YMapMarkerRef: any
    let yMarkers: any[] = []
    // Google провайдер
    let gmap: any
    let gMarkers: any[] = []
    if (!container.current) return
    ;(async () => {
      async function initMapbox() {
        const mod = await import('mapbox-gl')
        mapboxgl = mod.default
        mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) || 'pk.eyJ1IjoiZGV2aWQ2NzgiLCJhIjoiY21jM3A5bmd4MDMyaDJvcXY4emRwMmxnMiJ9.TL4w0VihB4fVY9cdUYxqMg'
        map = new mapboxgl.Map({
          container: container.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [37.6176, 55.7558],
          zoom: 10
        })
        map.on('load', () => {
          isLoaded = true
          map.addSource('events', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: true, clusterRadius: 40 } as any)
          map.addLayer({ id: 'clusters', type: 'circle', source: 'events', filter: ['has','point_count'], paint: { 'circle-color': '#00E5FF', 'circle-radius': 18 } })
          map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'events', filter: ['has','point_count'], layout: { 'text-field': ['get','point_count_abbreviated'], 'text-size': 12 } })
          map.addLayer({ id: 'unclustered', type: 'symbol', source: 'events', filter: ['!has','point_count'], layout: { 'text-field': ['get','emoji'], 'text-size': 22, 'text-allow-overlap': true, 'text-font': ['Noto Color Emoji Regular','Open Sans Regular','Arial Unicode MS Regular'] } })
          const src = map.getSource('events') as any
          if (src && lastGeojson) src.setData(lastGeojson)
          map.on('click', 'clusters', (e: any) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
            const clusterId = (features[0].properties as any)?.cluster_id
            ;(map.getSource('events') as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
              if (err) return
              map.easeTo({ center: (features[0].geometry as any).coordinates, zoom })
            })
          })
          map.on('click', 'unclustered', (e: any) => {
            const f = e.features?.[0]; if (!f) return
            const p = f.properties || {}
            new mapboxgl.Popup().setLngLat((f.geometry as any).coordinates).setHTML(`<strong>${(p as any).title || 'Событие'}</strong><br/>${(p as any).date || ''}`).addTo(map)
          })
        })
      }
      if (provider === 'yandex') {
        if (!(window as any).ymaps3) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script')
            const key = (import.meta.env.VITE_YANDEX_MAPS_API_KEY as string) || ''
            s.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(key)}&lang=ru_RU`
            s.async = true
            s.onload = () => resolve()
            s.onerror = () => reject(new Error('Yandex Maps load error'))
            document.head.appendChild(s)
          })
        }
        ymaps3 = (window as any).ymaps3
        await ymaps3.ready
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps3
        YMapMarkerRef = YMapMarker
        ymap = new YMap(container.current!, { location: { center: [37.6176, 55.7558], zoom: 10 } })
        ymap.addChild(new YMapDefaultSchemeLayer())
        ymap.addChild(new YMapDefaultFeaturesLayer())
        isLoaded = true
      } else if (provider === 'google') {
        // Загрузка Google Maps JS API
        try {
          if (!(window as any).google || !(window as any).google.maps) {
            await new Promise<void>((resolve, reject) => {
              const s = document.createElement('script')
              const key = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || ''
              s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=ru`
              s.async = true
              s.onload = () => resolve()
              s.onerror = () => reject(new Error('Google Maps load error'))
              document.head.appendChild(s)
            })
          }
          const google = (window as any).google
          if (!google || !google.maps) throw new Error('Google Maps not available')
          gmap = new google.maps.Map(container.current!, { center: { lat: 55.7558, lng: 37.6176 }, zoom: 10, mapTypeControl: false, fullscreenControl: false, streetViewControl: false })
          isLoaded = true
        } catch (e) {
          console.warn('Google Maps init failed, falling back to Mapbox:', (e as any)?.message)
          try {
            // Удаляем возможный overlay ошибки Google
            const cont = container.current!
            cont.querySelectorAll('.gm-err-container').forEach((n:any)=>n.remove())
            cont.innerHTML = ''
          } catch {}
          await initMapbox()
        }
      } else {
        await initMapbox()
      }

      // Используем API для получения событий из PostgreSQL
      const apiBase = import.meta.env.VITE_API_BASE || 'https://devid678-a11y-simplebot-cfb4.twc1.net'
      async function loadEvents() {
        try {
          const response = await fetch(`${apiBase}/api/events?limit=200&orderBy=created_at&order=desc`)
          if (response.ok) {
            const events = await response.json()
            const snap = { docs: events.map((e: any) => ({ id: e.id, data: () => e })) }
        ;(async () => {
          const feats: any[] = []
          const emojiByCategory: Record<string,string> = {
            'Вечеринка': '🎉',
            'Путешествие': '🧭',
            'Забег / Спортивное событие': '🏃',
            'Экскурсия': '🏛️',
            'Фестиваль': '🎪',
            'Концерт': '🎸',
            'Квартирник': '🏠',
            'Джем-сессия': '🥁',
            'Пикник / Барбекю': '🍢',
            'Танцевальная вечеринка': '💃',
            'Мастер-класс / Воркшоп': '🛠️',
            'Киноночь': '🎬',
            'Настольные игры': '🎲',
            'Квест': '🕵️',
            'Сходка': '👥'
          }
          for (const d of snap.docs) {
            const data = d.data() as any
            let lon: number | null = (data?.geo?.lng ?? data?.geo?.lon) ?? null
            let lat: number | null = data?.geo?.lat ?? null
            if (lon != null && lat != null) {
              const cat: string = Array.isArray(data?.categories) ? (data.categories[0] || 'Сходка') : (data?.category || 'Сходка')
              const emoji = emojiByCategory[cat] || '📍'
              feats.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [lon, lat] },
                properties: { id: d.id, title: data.title, date: new Date(data.startAtMillis).toLocaleString(), emoji }
              })
            }
          }
          lastGeojson = { type: 'FeatureCollection', features: feats }
          if (provider === 'yandex') {
            if (isLoaded && ymap && YMapMarkerRef) {
              // очистить старые маркеры
              for (const m of yMarkers) {
                try { ymap.removeChild(m) } catch {}
              }
              yMarkers = []
              for (const f of feats) {
                const el = document.createElement('div')
                el.style.fontSize = '20px'
                el.style.transform = 'translate(-50%, -50%)'
                el.textContent = f.properties.emoji || '📍'
                const marker = new YMapMarkerRef({ coordinates: f.geometry.coordinates }, el)
                yMarkers.push(marker)
                ymap.addChild(marker)
              }
            }
          } else if (provider === 'google') {
            const google = (window as any).google
            if (isLoaded && gmap && google && google.maps) {
              // очистить старые маркеры
              for (const m of gMarkers) { try { m.setMap(null) } catch {} }
              gMarkers = []
              for (const f of feats) {
                const pos = { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }
                const marker = new google.maps.Marker({
                  position: pos,
                  map: gmap,
                  label: { text: f.properties.emoji || '📍', fontSize: '20px' },
                  title: f.properties.title || 'Событие'
                })
                gMarkers.push(marker)
              }
            }
          } else {
            const src = map.getSource('events') as any
            if (src && isLoaded) src.setData(lastGeojson)
          }
        })()
      })

      return () => { unsub(); try {
        if (provider==='yandex') ymap?.destroy?.()
        else if (provider==='google') { for (const m of gMarkers) try { m.setMap(null) } catch {}; gMarkers = []; }
        else map.remove()
      } catch {} }
    })()

    return () => { try { map?.remove() } catch {} }
  }, [])

  return <div ref={container} style={{ width: '100%', height: 'calc(100vh - 88px)' }} />
}



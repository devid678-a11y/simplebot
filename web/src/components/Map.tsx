import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) || 'pk.eyJ1IjoiZGV2aWQ2NzgiLCJhIjoiY21jM3A5bmd4MDMyaDJvcXY4emRwMmxnMiJ9.TL4w0VihB4fVY9cdUYxqMg'

export default function Map() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    const map = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [37.6176, 55.7558],
      zoom: 10
    })

    map.on('load', () => {
      map.addSource('events', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 40
      } as any)

      map.addLayer({ id: 'clusters', type: 'circle', source: 'events', filter: ['has','point_count'],
        paint: { 'circle-color': '#00E5FF', 'circle-radius': 18 } })
      map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'events', filter: ['has','point_count'],
        layout: { 'text-field': ['get','point_count_abbreviated'], 'text-size': 12 } })
      map.addLayer({ id: 'unclustered', type: 'circle', source: 'events', filter: ['!has','point_count'],
        paint: { 'circle-color': '#00E5FF', 'circle-radius': 6, 'circle-stroke-width': 1.5, 'circle-stroke-color': '#fff' } })

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        const clusterId = (features[0].properties as any)?.cluster_id
        ;(map.getSource('events') as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return
          map.easeTo({ center: (features[0].geometry as any).coordinates, zoom })
        })
      })

      map.on('click', 'unclustered', (e) => {
        const f = e.features?.[0]; if (!f) return
        const p = f.properties || {}
        new mapboxgl.Popup().setLngLat((f.geometry as any).coordinates)
          .setHTML(`<strong>${(p as any).title || 'Событие'}</strong><br/>${(p as any).date || ''}`)
          .addTo(map)
      })
    })

    const q = query(
      collection(db, 'events'),
      where('startAtMillis', '>', Date.now()),
      orderBy('startAtMillis', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      ;(async () => {
        const feats: any[] = []
        for (const d of snap.docs) {
          const data = d.data() as any
          let lon: number | null = data?.geo?.lon ?? null
          let lat: number | null = data?.geo?.lat ?? null
          if ((lon == null || lat == null) && data?.location) {
            try {
              const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(String(data.location))}.json?access_token=${mapboxgl.accessToken}&language=ru`
              const resp = await fetch(url)
              const gj = await resp.json()
              const c = gj?.features?.[0]?.center
              if (Array.isArray(c) && c.length === 2) { lon = c[0]; lat = c[1] }
            } catch { /* ignore */ }
          }
          if (lon != null && lat != null) {
            feats.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [lon, lat] },
              properties: { id: d.id, title: data.title, date: new Date(data.startAtMillis).toLocaleString() }
            })
          }
        }
        const src = map.getSource('events') as mapboxgl.GeoJSONSource | undefined
        if (src) src.setData({ type: 'FeatureCollection', features: feats })
      })()
    })

    return () => { unsub(); map.remove() }
  }, [])

  return <div ref={container} style={{ width: '100%', height: 'calc(100vh - 88px)' }} />
}



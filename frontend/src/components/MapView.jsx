import React, {useEffect, useRef, useImperativeHandle, forwardRef} from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { fetchPointsGeoJSON, fetchPolygonsGeoJSON, computeBoundsFromCollections } from '../services/dataService.js'

// Contract
// Props:
// - accessToken: string
// - pointsVisible: boolean
// - polysVisible: boolean
// - globeEnabled: boolean
// - onStatus: ({points, polygonItems, polygonFeatures}) => void
// - onSelect: (featureProps) => void
// Exposed methods via ref:
// - fitToData()

const MapView = forwardRef(function MapView({accessToken, pointsVisible, polysVisible, globeEnabled=false, onStatus, onSelect}, ref){
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const dataBoundsRef = useRef(null)
  const globeEnabledRef = useRef(globeEnabled)
  const selectedPolyIdRef = useRef(null)

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    fitToData(){
      if(!mapRef.current) return
      const b = dataBoundsRef.current
      if(b) mapRef.current.fitBounds(b, {padding:50})
      else mapRef.current.fitBounds([[5.5,47.2],[15.5,55.1]], {padding:50})
    }
  }), [])

  function ensureLayerOrder(m){
    // Only ensure points are above everything else
    try{ m.moveLayer('clusters') }catch{}
    try{ m.moveLayer('cluster-count') }catch{}
    try{ m.moveLayer('unclustered-point') }catch{}
  }

  useEffect(()=>{
    if(mapRef.current) return
    if(!accessToken){
      // Show a visible warning in place of a white screen
      const node = mapNodeRef.current
      if(node){
        node.innerHTML = '<div style="position:absolute;left:16px;top:16px;padding:12px;border-radius:8px;background:rgba(3,10,14,0.85);border:1px solid rgba(0,230,255,0.08);color:#9ddbf0;font:14px/1.4 system-ui">Mapbox token missing. Create frontend/.env with VITE_MAPBOX_TOKEN=pk... and restart the dev server.</div>'
      }
      return
    }
    mapboxgl.accessToken = accessToken || ''

    const map = new mapboxgl.Map({
      container: mapNodeRef.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [13.404954, 52.520008],
      zoom: 6,
      pitch: 40,
      bearing: -10
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({showCompass:true, showZoom:true}), 'top-right')

    map.on('load', async ()=>{
      // Glow layer
      map.addSource('glow', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [ {type:'Feature', geometry:{type:'Point', coordinates:[13.404954,52.520008]}} ] }
      })
      map.addLayer({ id:'glow-layer', type:'circle', source:'glow', paint:{ 'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 30, 12, 140 ], 'circle-color':'rgba(0,230,255,0.05)', 'circle-blur':1 } })

      // Load data
      const [pointsFC, polysFC, status] = await Promise.all([
        fetchPointsGeoJSON(),
        fetchPolygonsGeoJSON(),
      ]).then(async ([p, poly])=>{
        const st = {
          points: p.features.length,
          polygonItems: poly.__itemCount || (poly.features.length ? 'n/a' : 0),
          polygonFeatures: poly.features.length
        }
        return [p, poly, st]
      })
      .catch((err)=>{
        console.error('Data load error', err)
        return [{type:'FeatureCollection', features:[]}, {type:'FeatureCollection', features:[]}, {points:0, polygonItems:0, polygonFeatures:0}]
      })

      // Add sources/layers
      map.addSource('points', { type:'geojson', data: pointsFC, cluster:true, clusterMaxZoom:14, clusterRadius:50 })
      map.addLayer({ id:'clusters', type:'circle', source:'points', filter:['has','point_count'], paint:{ 'circle-color':['step',['get','point_count'], '#00e6ff', 100, '#00b3cc', 750, '#008ba3'], 'circle-radius':['step',['get','point_count'], 12, 100, 18, 750, 24], 'circle-opacity':0.9 } })
      map.addLayer({ id:'cluster-count', type:'symbol', source:'points', filter:['has','point_count'], layout:{ 'text-field':'{point_count_abbreviated}', 'text-font':['DIN Offc Pro Medium','Arial Unicode MS Bold'], 'text-size':12 }, paint:{ 'text-color':'#001b1f' } })
      map.addLayer({ id:'unclustered-point', type:'circle', source:'points', filter:['!', ['has','point_count']], paint:{ 'circle-radius':6, 'circle-color':'#00e6ff', 'circle-stroke-color':'#0ff', 'circle-stroke-width':1.5, 'circle-opacity':0.95 } })

      // Polygons: insert below clusters so points are always above
      map.addSource('wein', { type:'geojson', data: polysFC, generateId: true })
      map.addLayer({ id:'wein-fill', type:'fill', source:'wein', paint:{ 'fill-color':'rgba(0,230,255,0.18)', 'fill-outline-color':'rgba(0,230,255,0.36)' } }, 'clusters')
      map.addLayer({ id:'wein-line', type:'line', source:'wein', paint:{ 'line-color':'rgba(0,230,255,0.5)', 'line-width':1.6 } }, 'clusters')
      // Highlight layer for selected polygon (toggle)
      map.addLayer({ id:'wein-highlight', type:'line', source:'wein', paint:{ 'line-color':'#00e6ff', 'line-width':3 }, filter: ['==', ['id'], -1] }, 'clusters')

      ensureLayerOrder(map)

      // Unified click handler with explicit priority: points > clusters > polygons
      map.on('click', (e)=>{
        const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point','clusters','cluster-count','wein-fill'] }) || []
        // 1) Unclustered point takes precedence
        const pointF = features.find(f=>f.layer?.id==='unclustered-point')
        if(pointF){
          // Clear polygon highlight when clicking a marker
          try{ map.setFilter('wein-highlight', ['==', ['id'], -1]) }catch{}
          selectedPolyIdRef.current = null
          const props = {...pointF.properties}
          for(const k in props){ const v = props[k]; if(typeof v==='string' && v.startsWith('{') && v.endsWith('}')){ try{ props[k]=JSON.parse(v)}catch{} } }
          // On globe mode, gently zoom to the marker
          try{
            if(globeEnabledRef.current){
              const coords = pointF.geometry?.coordinates
              if(Array.isArray(coords)){
                const currentZoom = map.getZoom()
                const targetZoom = Math.max(currentZoom, 9)
                map.easeTo({ center: coords, zoom: targetZoom, duration: 900 })
              }
            }
          }catch{}
          onSelect?.(props)
          return
        }
        // 2) Cluster (circle or label) -> expand
        const clusterF = features.find(f=>f.layer?.id==='clusters' || f.layer?.id==='cluster-count')
        if(clusterF){
          // Clear polygon highlight on cluster click
          try{ map.setFilter('wein-highlight', ['==', ['id'], -1]) }catch{}
          selectedPolyIdRef.current = null
          const clusterId = clusterF.properties?.cluster_id
          if(clusterId!=null){
            map.getSource('points').getClusterExpansionZoom(clusterId, (err, zoom)=>{
              if(err) return
              map.easeTo({ center: clusterF.geometry.coordinates, zoom })
            })
          }
          return
        }
        // 3) Polygon
        const polyF = features.find(f=>f.layer?.id==='wein-fill')
        if(polyF){
          const fid = typeof polyF.id === 'number' || typeof polyF.id === 'string' ? polyF.id : null
          if(fid != null){
            // Toggle selection
            if(selectedPolyIdRef.current === fid){
              try{ map.setFilter('wein-highlight', ['==', ['id'], -1]) }catch{}
              selectedPolyIdRef.current = null
            }else{
              try{ map.setFilter('wein-highlight', ['==', ['id'], fid]) }catch{}
              selectedPolyIdRef.current = fid
            }
          }
          const props = {...polyF.properties}
          for(const k in props){ const v = props[k]; if(typeof v==='string' && v.startsWith('{') && v.endsWith('}')){ try{ props[k]=JSON.parse(v)}catch{} } }
          onSelect?.(props)
          return
        }
      })

      map.on('mouseenter', 'clusters', ()=> map.getCanvas().style.cursor='pointer')
      map.on('mouseleave', 'clusters', ()=> map.getCanvas().style.cursor='')
      map.on('mouseenter', 'unclustered-point', ()=> map.getCanvas().style.cursor='pointer')
      map.on('mouseleave', 'unclustered-point', ()=> map.getCanvas().style.cursor='')
      map.on('mouseenter', 'wein-fill', ()=>{ map.setPaintProperty('wein-fill','fill-color','rgba(0,230,255,0.26)'); map.getCanvas().style.cursor='pointer' })
      map.on('mouseleave', 'wein-fill', ()=>{ map.setPaintProperty('wein-fill','fill-color','rgba(0,230,255,0.18)'); map.getCanvas().style.cursor='' })

      // Status and bounds
      onStatus?.(status)
      const b = computeBoundsFromCollections(pointsFC, polysFC)
      if(b){
        dataBoundsRef.current = b
      }
    })

    map.on('error', (e)=>{
      console.error('Map error', e?.error)
    })

    return ()=>{
      map.remove()
      mapRef.current = null
    }
  }, [accessToken])

  // Globe toggle
  useEffect(()=>{
    const m = mapRef.current
    if(!m) return
    if(globeEnabled){
      try{ m.setProjection('globe') }catch{}
      // Terrain source (Mapbox DEM)
      if(!m.getSource('terrain')){
        try{
          m.addSource('terrain', { type: 'raster-dem', url: 'mapbox://mapbox.terrain-rgb', tileSize: 512, maxzoom: 14 })
        }catch{}
      }
      try{ m.setTerrain({ source:'terrain', exaggeration: 1.2 }) }catch{}
      try{ m.setFog({ color: 'rgb(186, 210, 235)', 'high-color': 'rgb(36, 92, 223)', 'horizon-blend': 0.02, 'space-color': 'rgb(11, 11, 25)', 'star-intensity': 0.6 }) }catch{}
      // Smooth camera tilt/bearing for globe
      try{ m.easeTo({ pitch: 60, bearing: -20, duration: 1000 }) }catch{}
    }else{
      try{ m.setTerrain(null) }catch{}
      try{ m.setFog(null) }catch{}
      try{ m.setProjection('mercator') }catch{}
      // Smooth camera reset for 2D
      try{ m.easeTo({ pitch: 40, bearing: -10, duration: 800 }) }catch{}
    }
  }, [globeEnabled])

  // Visibility toggles
  useEffect(()=>{
    const m = mapRef.current
    if(!m) return
    const vis = pointsVisible ? 'visible' : 'none'
    ;['clusters','cluster-count','unclustered-point'].forEach(id=>{ try{ m.setLayoutProperty(id,'visibility',vis) }catch{} })
    ensureLayerOrder(m)
  }, [pointsVisible])

  useEffect(()=>{
    const m = mapRef.current
    if(!m) return
    const vis = polysVisible ? 'visible' : 'none'
    ;['wein-fill','wein-line'].forEach(id=>{ try{ m.setLayoutProperty(id,'visibility',vis) }catch{} })
    ensureLayerOrder(m)
  }, [polysVisible])

  return <div ref={mapNodeRef} style={{width:'100%', height:'100vh', background:'#061016'}} />
})

export default MapView

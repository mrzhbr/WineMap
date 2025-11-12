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
// - satelliteEnabled: boolean
// - onStatus: ({points, polygonItems, polygonFeatures}) => void
// - onSelect: (featureProps) => void
// Exposed methods via ref:
// - fitToData()

const MapView = forwardRef(function MapView({accessToken, pointsVisible, polysVisible, globeEnabled=false, satelliteEnabled=false, onStatus, onSelect}, ref){
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const dataBoundsRef = useRef(null)
  const globeEnabledRef = useRef(globeEnabled)
  const selectedPolyIdRef = useRef(null)
  const satelliteEnabledRef = useRef(satelliteEnabled)
  const lastSatelliteStateRef = useRef(null) // Initialize to null so first change always triggers

  // Helper function to get colors based on satellite mode
  const getColors = (isSatellite) => ({
    clusterColors: isSatellite 
      ? ['step',['get','point_count'], '#ff0080', 100, '#e6006f', 750, '#cc0066']
      : ['step',['get','point_count'], '#00e6ff', 100, '#00b3cc', 750, '#008ba3'],
    pointColor: isSatellite ? '#ff0080' : '#00e6ff',
    pointStrokeColor: isSatellite ? '#ff33a1' : '#0ff',
    fillColor: isSatellite ? 'rgba(255, 0, 128, 0.22)' : 'rgba(0,230,255,0.18)',
    fillOutlineColor: isSatellite ? 'rgba(255, 0, 128, 0.5)' : 'rgba(0,230,255,0.36)',
    lineColor: isSatellite ? 'rgba(255, 51, 161, 0.8)' : 'rgba(0,230,255,0.5)',
    highlightColor: isSatellite ? '#ff0080' : '#00e6ff'
  })

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    fitToData(){
      if(!mapRef.current) return
      const b = dataBoundsRef.current
      if(b) mapRef.current.fitBounds(b, {padding:50})
      else mapRef.current.fitBounds([[5.5,47.2],[15.5,55.1]], {padding:50})
    },
    flyToRegion(lat, lng, zoom = 10){
      if(!mapRef.current) return
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: zoom,
        duration: 2000,
        essential: true
      })
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

      // Add sources/layers with initial colors based on satelliteEnabledRef
      const colors = getColors(satelliteEnabledRef.current)
      
      map.addSource('points', { type:'geojson', data: pointsFC, cluster:true, clusterMaxZoom:14, clusterRadius:50 })
      map.addLayer({ id:'clusters', type:'circle', source:'points', filter:['has','point_count'], paint:{ 'circle-color': colors.clusterColors, 'circle-radius':['step',['get','point_count'], 12, 100, 18, 750, 24], 'circle-opacity':0.9 } })
      map.addLayer({ id:'cluster-count', type:'symbol', source:'points', filter:['has','point_count'], layout:{ 'text-field':'{point_count_abbreviated}', 'text-font':['DIN Offc Pro Medium','Arial Unicode MS Bold'], 'text-size':12 }, paint:{ 'text-color':'#001b1f' } })
      map.addLayer({ id:'unclustered-point', type:'circle', source:'points', filter:['!', ['has','point_count']], paint:{ 'circle-radius':6, 'circle-color': colors.pointColor, 'circle-stroke-color': colors.pointStrokeColor, 'circle-stroke-width':1.5, 'circle-opacity':0.95 } })

      // Polygons: insert below clusters so points are always above
      map.addSource('wein', { type:'geojson', data: polysFC, generateId: true })
      map.addLayer({ id:'wein-fill', type:'fill', source:'wein', paint:{ 'fill-color': colors.fillColor, 'fill-outline-color': colors.fillOutlineColor } }, 'clusters')
      map.addLayer({ id:'wein-line', type:'line', source:'wein', paint:{ 'line-color': colors.lineColor, 'line-width':1.6 } }, 'clusters')
      // Highlight layer for selected polygon (toggle)
      map.addLayer({ id:'wein-highlight', type:'line', source:'wein', paint:{ 'line-color': colors.highlightColor, 'line-width':3 }, filter: ['==', ['id'], -1] }, 'clusters')

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
      
      // Polygon hover with highlight outline
      map.on('mousemove', 'wein-fill', (e)=>{ 
        if (e.features && e.features.length > 0) {
          const feature = e.features[0]
          const fid = typeof feature.id === 'number' || typeof feature.id === 'string' ? feature.id : null
          
          if (fid != null && fid !== selectedPolyIdRef.current) {
            // Show hover highlight
            try { map.setFilter('wein-highlight', ['==', ['id'], fid]) } catch {}
          }
        }
        map.getCanvas().style.cursor='pointer' 
      })
      
      map.on('mouseleave', 'wein-fill', ()=>{ 
        // Remove hover highlight (unless it's the selected polygon)
        if (selectedPolyIdRef.current != null) {
          try { map.setFilter('wein-highlight', ['==', ['id'], selectedPolyIdRef.current]) } catch {}
        } else {
          try { map.setFilter('wein-highlight', ['==', ['id'], -1]) } catch {}
        }
        map.getCanvas().style.cursor='' 
      })

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

  // Update satelliteEnabledRef when prop changes
  useEffect(()=>{
    satelliteEnabledRef.current = satelliteEnabled
  }, [satelliteEnabled])

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

  // Update colors when satellite mode changes (without style change)
  useEffect(()=>{
    const m = mapRef.current
    if(!m || !m.isStyleLoaded()) return
    
    const colors = getColors(satelliteEnabled)
    
    // Update all layer colors with a slight delay to ensure layers exist
    const updateColors = () => {
      try{ m.setPaintProperty('clusters', 'circle-color', colors.clusterColors) }catch{}
      try{ m.setPaintProperty('unclustered-point', 'circle-color', colors.pointColor) }catch{}
      try{ m.setPaintProperty('unclustered-point', 'circle-stroke-color', colors.pointStrokeColor) }catch{}
      try{ m.setPaintProperty('wein-fill', 'fill-color', colors.fillColor) }catch{}
      try{ m.setPaintProperty('wein-fill', 'fill-outline-color', colors.fillOutlineColor) }catch{}
      try{ m.setPaintProperty('wein-line', 'line-color', colors.lineColor) }catch{}
      try{ m.setPaintProperty('wein-highlight', 'line-color', colors.highlightColor) }catch{}
    }
    
    updateColors()
    // Also try again after a delay in case layers weren't ready
    const timer = setTimeout(updateColors, 200)
    return () => clearTimeout(timer)
  }, [satelliteEnabled])

  // Satellite toggle with smooth transition
  useEffect(()=>{
    const m = mapRef.current
    if(!m) return
    
    // Only change if the state actually changed
    if(lastSatelliteStateRef.current === satelliteEnabled) return
    lastSatelliteStateRef.current = satelliteEnabled
    
    const targetStyle = satelliteEnabled 
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/dark-v10'
    
    console.log('Switching to style:', targetStyle)


    
    // Smooth transition: fade out, change style, fade in
    const mapContainer = m.getContainer()
    mapContainer.style.transition = 'opacity 0.5s ease-in-out'
    mapContainer.style.opacity = '0'

        
    

    
    setTimeout(() => {
      m.setStyle(targetStyle)
      
      m.once('styledata', () => {
        // Re-add all custom sources and layers after style change
        if(!m.getSource('glow')){
          try{
            m.addSource('glow', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [ {type:'Feature', geometry:{type:'Point', coordinates:[13.404954,52.520008]}} ] }
            })
            m.addLayer({ id:'glow-layer', type:'circle', source:'glow', paint:{ 'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 30, 12, 140 ], 'circle-color':'rgba(0,230,255,0.05)', 'circle-blur':1 } })
          }catch{}
        }
        
        // Re-fetch and add data sources
        Promise.all([fetchPointsGeoJSON(), fetchPolygonsGeoJSON()])
          .then(([pointsFC, polysFC]) => {
            // Get colors based on satellite mode
            const colors = getColors(satelliteEnabled)
            const {clusterColors, pointColor, pointStrokeColor, fillColor, fillOutlineColor, lineColor, highlightColor} = colors
            
            if(!m.getSource('points')){
              m.addSource('points', { type:'geojson', data: pointsFC, cluster:true, clusterMaxZoom:14, clusterRadius:50 })
              m.addLayer({ id:'clusters', type:'circle', source:'points', filter:['has','point_count'], paint:{ 'circle-color': clusterColors, 'circle-radius':['step',['get','point_count'], 12, 100, 18, 750, 24], 'circle-opacity':0.9 } })
              m.addLayer({ id:'cluster-count', type:'symbol', source:'points', filter:['has','point_count'], layout:{ 'text-field':'{point_count_abbreviated}', 'text-font':['DIN Offc Pro Medium','Arial Unicode MS Bold'], 'text-size':12 }, paint:{ 'text-color':'#001b1f' } })
              m.addLayer({ id:'unclustered-point', type:'circle', source:'points', filter:['!', ['has','point_count']], paint:{ 'circle-radius':6, 'circle-color': pointColor, 'circle-stroke-color': pointStrokeColor, 'circle-stroke-width':1.5, 'circle-opacity':0.95 } })
            }
            
            if(!m.getSource('wein')){
              m.addSource('wein', { type:'geojson', data: polysFC, generateId: true })
              m.addLayer({ id:'wein-fill', type:'fill', source:'wein', paint:{ 'fill-color': fillColor, 'fill-outline-color': fillOutlineColor } }, 'clusters')
              m.addLayer({ id:'wein-line', type:'line', source:'wein', paint:{ 'line-color': lineColor, 'line-width':1.6 } }, 'clusters')
              m.addLayer({ id:'wein-highlight', type:'line', source:'wein', paint:{ 'line-color': highlightColor, 'line-width':3 }, filter: ['==', ['id'], -1] }, 'clusters')
            }
            
            ensureLayerOrder(m)
            
            // Visibility will be restored by the visibility toggle effects
            
            // Fade back in first
            mapContainer.style.opacity = '1'
            
            // Update colors after fade-in to ensure they persist
            setTimeout(() => {
              try{ m.setPaintProperty('clusters', 'circle-color', clusterColors) }catch{}
              try{ m.setPaintProperty('unclustered-point', 'circle-color', pointColor) }catch{}
              try{ m.setPaintProperty('unclustered-point', 'circle-stroke-color', pointStrokeColor) }catch{}
              try{ m.setPaintProperty('wein-fill', 'fill-color', fillColor) }catch{}
              try{ m.setPaintProperty('wein-fill', 'fill-outline-color', fillOutlineColor) }catch{}
              try{ m.setPaintProperty('wein-line', 'line-color', lineColor) }catch{}
              try{ m.setPaintProperty('wein-highlight', 'line-color', highlightColor) }catch{}
            }, 600)
          })
          .catch(err => {
            console.error('Error re-adding layers after style change:', err)
            mapContainer.style.opacity = '1'
          })
      })
    }, 500)
  }, [satelliteEnabled])

  return <div ref={mapNodeRef} style={{width:'100%', height:'100vh', background:'#061016'}} />
})

export default MapView

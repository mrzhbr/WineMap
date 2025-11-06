import React, {useEffect, useRef, useState} from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './styles.css'

const token = import.meta.env.VITE_MAPBOX_TOKEN
mapboxgl.accessToken = token

export default function App(){
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [lng, setLng] = useState(13.404954)
  const [lat, setLat] = useState(52.520008)
  const [zoom, setZoom] = useState(10)
  const [selected, setSelected] = useState(null)

  const markers = [
    {id: 'berlin', lat: 52.520008, lon: 13.404954, label: 'Berlin'},
    {id: 'potsdam', lat: 52.3969, lon: 13.0586, label: 'Potsdam'},
    {id: 'cologne', lat: 50.9375, lon: 6.9603, label: 'Cologne'}
  ]

  useEffect(()=>{
    if(map.current) return
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [lng, lat],
      zoom: zoom,
      pitch: 45,
      bearing: -10
    })

    map.current.on('move', ()=>{
      setLng(Number(map.current.getCenter().lng.toFixed(4)))
      setLat(Number(map.current.getCenter().lat.toFixed(4)))
      setZoom(Number(map.current.getZoom().toFixed(2)))
    })

    // Add markers
    markers.forEach(m=>{
      const el = document.createElement('div')
      el.className = 'pin'
      el.style.cursor = 'pointer'
      el.addEventListener('click', (e)=>{
        e.stopPropagation()
        setSelected(m)
      })

      new mapboxgl.Marker(el).setLngLat([m.lon, m.lat]).addTo(map.current)
    })

    return ()=> map.current?.remove()
  }, [])

  useEffect(()=>{
    if(!map.current) return
    if(selected){
      map.current.flyTo({center: [selected.lon, selected.lat], zoom: 11, duration: 1000})
    }
  }, [selected])

  return (
    <div className="app">
      <div ref={mapContainer} style={{width: '100%', height: '100vh'}} />

      <div className="sidebar">
        <h2>Futuristic Map</h2>
        <p>Palantir / Gotham inspired dark UI with crisp neon accents.</p>
        <div style={{marginTop:12}}>
          <button onClick={()=>map.current?.flyTo({center:[13.404954,52.520008],zoom:10,duration:1000})}>Fly to Berlin</button>
        </div>

        <div style={{marginTop:12,color:'#a9cbd1',fontSize:13}}>
          <div>Lng: {lng}</div>
          <div>Lat: {lat}</div>
          <div>Zoom: {zoom}</div>
          {selected && <div style={{marginTop:8}}>Selected: {selected.label}</div>}
        </div>
      </div>

      {selected && (
        <div className="popup" style={{position:'absolute',left:20, bottom:20, zIndex:4}}>
          <div style={{background:'#071017',padding:12,borderRadius:8,border:'1px solid rgba(0,230,255,0.08)'}}>
            <strong>{selected.label}</strong>
            <div style={{fontSize:13,color:'#9bbec3',marginTop:6}}>A futuristic Gotham-style info card.</div>
            <div style={{marginTop:8}}>
              <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.04)',color:'#9ddbf0',padding:'6px 10px',borderRadius:6}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


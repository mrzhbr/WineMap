import React, { useRef, useState } from 'react'
import './styles.css'
import useMapboxToken from './hooks/useMapboxToken'
import MapView from './components/MapView'
import SidebarMenu from './components/SidebarMenu'
import InfoCard from './components/InfoCard'
import StatusBadge from './components/StatusBadge'

export default function App(){
  const token = useMapboxToken()
  const mapRef = useRef(null)

  const [pointsVisible, setPointsVisible] = useState(true)
  const [polysVisible, setPolysVisible] = useState(true)
  const [globeEnabled, setGlobeEnabled] = useState(false)
  const [satelliteEnabled, setSatelliteEnabled] = useState(false)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState(null)

  const handleZoomData = ()=> mapRef.current?.fitToData()
  
  const handleFlyToRegion = (lat, lng, zoom, regionData) => {
    mapRef.current?.flyToRegion(lat, lng, zoom)
    if (regionData) {
      setSelected(regionData)
    }
  }

  return (
    <div className="app">
      <MapView
        ref={mapRef}
        accessToken={token}
        pointsVisible={pointsVisible}
        polysVisible={polysVisible}
        globeEnabled={globeEnabled}
        satelliteEnabled={satelliteEnabled}
        onStatus={setStatus}
        onSelect={setSelected}
      />

      <SidebarMenu
        onZoomData={handleZoomData}
        pointsVisible={pointsVisible}
        setPointsVisible={setPointsVisible}
        polysVisible={polysVisible}
        setPolysVisible={setPolysVisible}
        globeEnabled={globeEnabled}
        setGlobeEnabled={setGlobeEnabled}
        satelliteEnabled={satelliteEnabled}
        setSatelliteEnabled={setSatelliteEnabled}
        onFlyToRegion={handleFlyToRegion}
      />

      <InfoCard feature={selected} onClose={()=>setSelected(null)} satelliteEnabled={satelliteEnabled} />
      <StatusBadge status={status} satelliteEnabled={satelliteEnabled} />
    </div>
  )
}

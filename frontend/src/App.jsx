import React, { useRef, useState } from 'react'
import './styles.css'
import useMapboxToken from './hooks/useMapboxToken'
import MapView from './components/MapView'
import ControlsPanel from './components/ControlsPanel'
import InfoCard from './components/InfoCard'
import StatusBadge from './components/StatusBadge'

export default function App(){
  const token = useMapboxToken()
  const mapRef = useRef(null)

  const [pointsVisible, setPointsVisible] = useState(true)
  const [polysVisible, setPolysVisible] = useState(true)
  const [globeEnabled, setGlobeEnabled] = useState(false)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState(null)

  const handleZoomData = ()=> mapRef.current?.fitToData()

  return (
    <div className="app">
      <MapView
        ref={mapRef}
        accessToken={token}
        pointsVisible={pointsVisible}
        polysVisible={polysVisible}
        globeEnabled={globeEnabled}
        onStatus={setStatus}
        onSelect={setSelected}
      />

      <ControlsPanel
        onZoomData={handleZoomData}
        pointsVisible={pointsVisible}
        setPointsVisible={setPointsVisible}
        polysVisible={polysVisible}
        setPolysVisible={setPolysVisible}
        globeEnabled={globeEnabled}
        setGlobeEnabled={setGlobeEnabled}
      />

      <InfoCard feature={selected} onClose={()=>setSelected(null)} />
      <StatusBadge status={status} />
    </div>
  )
}

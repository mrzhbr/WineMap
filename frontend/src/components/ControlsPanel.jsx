import React from 'react'

export default function ControlsPanel({onZoomData, pointsVisible, setPointsVisible, polysVisible, setPolysVisible, globeEnabled, setGlobeEnabled}){
  return (
    <div className="sidebar">
      <h2>Futuristic Wine Map</h2>
      <p>A map that shows international wine growing regions and German parcels</p>
      <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap'}}>
        <button onClick={onZoomData}>Zoom to data</button>
        <button onClick={()=>setPointsVisible(v=>!v)}>{pointsVisible? 'Hide points':'Show points'}</button>
        <button onClick={()=>setPolysVisible(v=>!v)}>{polysVisible? 'Hide polygons':'Show polygons'}</button>
        <button onClick={()=>setGlobeEnabled(v=>!v)}>{globeEnabled? 'Disable 3D globe':'Enable 3D globe'}</button>
      </div>
    </div>
  )
}

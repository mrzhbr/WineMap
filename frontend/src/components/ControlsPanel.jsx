import React from 'react'

export default function ControlsPanel({onZoomData, pointsVisible, setPointsVisible, polysVisible, setPolysVisible, globeEnabled, setGlobeEnabled, satelliteEnabled, setSatelliteEnabled}){
  
  // White/glass look in all modes
  const panelStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    color: '#ffffff'
  }
  
  const buttonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    color: '#ffffff',
    fontWeight: '500'
  }
  
  const mutedStyle = {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px'
  }
  
  return (
    <div className="sidebar" style={panelStyle}>
      <h2>Futuristic Wine Map</h2>
      <p style={mutedStyle}>A map that shows international wine growing regions and German parcels</p>
      <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap'}}>
        <button style={buttonStyle} onClick={onZoomData}>Zoom to data</button>
        <button style={buttonStyle} onClick={()=>setPointsVisible(v=>!v)}>{pointsVisible? 'Hide points':'Show points'}</button>
        <button style={buttonStyle} onClick={()=>setPolysVisible(v=>!v)}>{polysVisible? 'Hide polygons':'Show polygons'}</button>
        <button style={buttonStyle} onClick={()=>setGlobeEnabled(v=>!v)}>{globeEnabled? 'Disable 3D globe':'Enable 3D globe'}</button>
        <button style={buttonStyle} onClick={()=>setSatelliteEnabled(v=>!v)}>{satelliteEnabled? 'Disable satellite':'Enable satellite'}</button>
      </div>
    </div>
  )
}

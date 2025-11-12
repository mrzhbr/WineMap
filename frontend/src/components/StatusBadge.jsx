import React from 'react'

export default function StatusBadge({status, satelliteEnabled}){
  const text = status ? `Points: ${status.points} | Polygons: ${status.polygonFeatures}` : 'Loading...'
  
  const badgeStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    color: satelliteEnabled ? '#ff0080' : '#00e6ff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    fontWeight: '500'
  }
  
  return (
    <div style={{position:'absolute', left:16, bottom:16, zIndex:6, padding:'8px 10px', borderRadius:8, fontSize:13, ...badgeStyle}}>
      {text}
    </div>
  )
}

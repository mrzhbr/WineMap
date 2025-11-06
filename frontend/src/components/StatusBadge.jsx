import React from 'react'

export default function StatusBadge({status}){
  const text = status ? `Points: ${status.points} | Polygon features: ${status.polygonFeatures}` : 'Loading...'
  return (
    <div style={{position:'absolute', left:16, bottom:16, zIndex:6, padding:'8px 10px', borderRadius:8, background:'rgba(3,10,14,0.7)', color:'#9ddbf0', fontSize:13, border:'1px solid rgba(0,230,255,0.06)', backdropFilter:'blur(4px)'}}>
      {text}
    </div>
  )
}

// Data fetching & transforms

function safeJson(r){ return r.json() }

function stringifyProps(obj){
  const out = {...obj}
  for(const k in out){
    if(typeof out[k] === 'object' && out[k] !== null){
      try{ out[k] = JSON.stringify(out[k]) }catch{}
    }
  }
  return out
}

export async function fetchPointsGeoJSON(){
  // Try from window.DE_DATA (prefetched by legacy, not used now) or fetch
  let raw
  try{
    if(typeof window !== 'undefined' && window.DE_DATA) raw = window.DE_DATA
  }catch{}
  if(!raw){
    raw = await fetch('/data/Deutsche_Weinlagen.json').then(safeJson)
  }
  const items = Array.isArray(raw?.items) ? raw.items : (raw && typeof raw === 'object' ? Object.values(raw) : [])
  const features = []
  for(const item of items){
    const tryLat = item.geo_lat || item.lat || item.latitude || item.LAT || null
    const tryLng = item.geo_lng || item.lng || item.longitude || item.LNG || null
    if(!tryLat || !tryLng) continue
    const latNum = Number(tryLat); const lngNum = Number(tryLng)
    if(Number.isNaN(latNum) || Number.isNaN(lngNum)) continue
    features.push({ type:'Feature', geometry:{type:'Point', coordinates:[lngNum, latNum]}, properties: stringifyProps(item) })
  }
  return { type:'FeatureCollection', features }
}

export async function fetchPolygonsGeoJSON(){
  let raw
  try{
    if(typeof window !== 'undefined' && window.WEIN_DATA) raw = window.WEIN_DATA
  }catch{}
  if(!raw){
    raw = await fetch('/data/Weinanbaugebiete.json').then(safeJson)
  }
  const features = []
  let itemCount = 0
  for(const item of (raw?.items || [])){
    if(item.polygons && Array.isArray(item.polygons)){
      itemCount++
      for(const poly of item.polygons){
        const ring = poly.map(pt => [Number(pt[0]), Number(pt[1])])
        features.push({ type:'Feature', geometry:{type:'Polygon', coordinates:[ring]}, properties: stringifyProps(item) })
      }
    }
  }
  const fc = { type:'FeatureCollection', features }
  Object.defineProperty(fc, '__itemCount', {value:itemCount, enumerable:false})
  return fc
}

export function computeBoundsFromCollections(pointsFC, polysFC){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity
  for(const f of pointsFC?.features || []){
    const [x,y] = f.geometry.coordinates
    if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y
  }
  for(const f of polysFC?.features || []){
    const coords = f.geometry.coordinates?.[0] || []
    for(const [x,y] of coords){
      if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y
    }
  }
  if(isFinite(minX)) return [[minX,minY],[maxX,maxY]]
  return null
}


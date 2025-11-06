import React from 'react'

export default function InfoCard({feature, onClose}){
  if(!feature) return null
  const title = feature.bezeichnung || feature.label || feature.name || feature.lage || 'Feature'

  const isNonEmpty = (v)=>{
    if(v == null) return false
    if(typeof v === 'string'){
      const t = v.trim()
      if(!t) return false
      const lower = t.toLowerCase()
      if(lower === 'null' || lower === 'undefined') return false
      if(t === '[]' || t === '{}') return false
      return true
    }
    if(Array.isArray(v)) return v.length > 0
    if(typeof v === 'object') return Object.keys(v).length > 0
    return true
  }

  const parseAnchor = (s)=>{
    if(typeof s !== 'string') return null
    const m = s.match(/<a\s+href=['"]([^'"]+)['"][^>]*>(.*?)<\/a>/i)
    if(m){
      return { href: m[1], text: (m[2] || m[1]).trim() }
    }
    return null
  }

  const isMeaninglessHtml = (s)=>{
    if(typeof s !== 'string') return false
    // Remove common empty HTML bits and tags
    let txt = s
      .replace(/<br[^>]*>/gi, ' ') // remove line breaks
      .replace(/<[^>]+>/g, ' ')    // remove any remaining tags
      .replace(/&nbsp;/gi, ' ')    // convert nbsp
      .trim()
    // Collapse whitespace
    txt = txt.replace(/\s+/g, ' ')
    return txt.length === 0
  }

  const lines = []
  if(isNonEmpty(feature.land_bezeichnung)) lines.push(<div key="land"><strong>Country/Region:</strong> {feature.land_bezeichnung}</div>)
  if(isNonEmpty(feature.bundesland)) lines.push(<div key="bundesland"><strong>Bundesland:</strong> {feature.bundesland}</div>)

  // Info: handle both 'info' and 'infos', clickable if contains <a href="...">..</a>, otherwise skip if meaningless HTML
  const infoRaw = feature.info ?? feature.infos
  if(isNonEmpty(infoRaw)){
    const anchor = parseAnchor(infoRaw)
    if(anchor){
      lines.push(
        <div key="info"><strong>Info:</strong> <a href={anchor.href} target="_blank" rel="noopener noreferrer">{anchor.text}</a></div>
      )
    } else if(!(typeof infoRaw === 'string' && isMeaninglessHtml(infoRaw))) {
      lines.push(<div key="info"><strong>Info:</strong> {String(infoRaw)}</div>)
    }
  }

  if(isNonEmpty(feature.anbauName)) lines.push(<div key="anbau"><strong>Anbau:</strong> {feature.anbauName}</div>)
  if(isNonEmpty(feature.lage)) lines.push(<div key="lage"><strong>Lage:</strong> {feature.lage}</div>)
  if(isNonEmpty(feature.gemeinde)) lines.push(<div key="gemeinde"><strong>Gemeinde:</strong> {feature.gemeinde}</div>)
  if(isNonEmpty(feature.rebsorten)) lines.push(<div key="rebsorten"><strong>Grapes:</strong> {feature.rebsorten}</div>)
  if(isNonEmpty(feature.winzer)) lines.push(<div key="winzer"><strong>Winzer:</strong> {feature.winzer}</div>)
  if(isNonEmpty(feature.weine)) lines.push(<div key="weine"><strong>Weine:</strong> {feature.weine}</div>)

  const area = feature.flaeche || feature.area
  if(isNonEmpty(area)) lines.push(<div key="area"><strong>Area (ha):</strong> {area}</div>)

  return (
    <div style={{position:'absolute', right:16, bottom:16, zIndex:4}}>
      <div className="infocard" style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))',
        color: '#cfeff4',
        padding: 16,
        borderRadius: 10,
        border: '1px solid rgba(0,230,255,0.08)',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 6px 30px rgba(0,0,0,0.6)'
      }}>
        <strong>{title}</strong>
        <div style={{fontSize:13,color:'#9bbec3',marginTop:6}}>
          {lines.length ? lines : 'No additional information available.'}
        </div>
        <div style={{marginTop:8}}>
          <button className="btn" style={{borderColor:'rgba(255,255,255,0.04)',color:'#9ddbf0',padding:'6px 10px'}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

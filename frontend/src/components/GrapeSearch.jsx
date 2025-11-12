import React, { useState, useEffect } from 'react'

export default function GrapeSearch({ satelliteEnabled, onResultsFound, onFlyToRegion }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [allRegions, setAllRegions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)

  // Load wine regions data
  useEffect(() => {
    fetch('/data/Weinanbaugebiete.json')
      .then(res => res.json())
      .then(data => {
        setAllRegions(data.items || [])
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Error loading wine regions:', err)
        setIsLoading(false)
      })
  }, [])

  // Search function
  const handleSearch = (term) => {
    setSearchTerm(term)
    
    if (!term.trim()) {
      // Fade out before clearing
      setShowResults(false)
      setTimeout(() => {
        setResults([])
      }, 300)
      onResultsFound?.(null)
      return
    }

    const searchLower = term.toLowerCase().trim()
    
    // Filter regions that have the grape variety
    const matches = allRegions.filter(region => {
      if (!region.rebsorten) return false
      
      const grapes = region.rebsorten
        .split(';')
        .map(g => g.trim().toLowerCase())
      
      return grapes.some(grape => grape.includes(searchLower))
    })

    // Only animate when transitioning between zero and non-zero results
    const hadResults = results.length > 0
    const hasMatches = matches.length > 0
    
    if (hadResults && !hasMatches) {
      // Fade out when going from results to no results
      setShowResults(false)
      setTimeout(() => {
        setResults(matches)
      }, 300)
    } else if (!hadResults && hasMatches) {
      // Fade in when going from no results to results
      setResults(matches)
      setTimeout(() => setShowResults(true), 50)
    } else {
      // Just update results without animation (typing continues)
      setResults(matches)
      if (hasMatches && !showResults) {
        setShowResults(true)
      }
    }
    
    onResultsFound?.(matches)
  }

  const panelStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    color: '#ffffff',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '12px'
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none'
  }

  const resultItemStyle = {
    padding: '6px 8px',
    marginTop: '4px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    fontSize: '13px',
    borderLeft: `3px solid ${satelliteEnabled ? '#ff0080' : '#00e6ff'}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
  
  const handleRegionClick = (region) => {
    const lat = parseFloat(region.geo_lat)
    const lng = parseFloat(region.geo_lng)
    const zoom = parseInt(region.geo_zoom) || 10
    
    if (!isNaN(lat) && !isNaN(lng)) {
      onFlyToRegion?.(lat, lng, zoom, region)
    }
  }

  const resultsContainerStyle = {
    maxHeight: showResults ? '200px' : '0px',
    overflowY: 'auto',
    marginTop: '8px',
    opacity: showResults ? 1 : 0,
    transform: `translateY(${showResults ? '0' : '-10px'})`,
    transition: 'all 0.3s ease',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
    WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
  }

  return (
    <>
      <style>{`
        .grape-search-results::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div style={panelStyle}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Rebsorten-Suche</h3>
      <input
        type="text"
        placeholder="Rebsorte eingeben (z.B. Riesling, Merlot)..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        style={inputStyle}
        disabled={isLoading}
      />
      
      {isLoading && (
        <div style={{ marginTop: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
          Lade Daten...
        </div>
      )}
      
      {searchTerm && !isLoading && (
        <div style={{ marginTop: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
          {results.length} Anbaugebiet{results.length !== 1 ? 'e' : ''} gefunden
        </div>
      )}
      
      {results.length > 0 && (
        <div className="grape-search-results" style={resultsContainerStyle}>
          {results.map((region, idx) => (
            <div 
              key={region.id || idx} 
              style={resultItemStyle}
              onClick={() => handleRegionClick(region)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <strong>{region.bezeichnung}</strong>
              {region.land && <span style={{ opacity: 0.7 }}> ({region.land})</span>}
              {region.flaeche && region.flaeche !== '0' && (
                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>
                  Fläche: {region.flaeche} ha
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  )
}

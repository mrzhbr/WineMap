import React, { useState } from 'react'
import ControlsPanel from './ControlsPanel'
import GrapeSearch from './GrapeSearch'

export default function SidebarMenu({ 
  onZoomData, 
  pointsVisible, 
  setPointsVisible, 
  polysVisible, 
  setPolysVisible, 
  globeEnabled, 
  setGlobeEnabled, 
  satelliteEnabled, 
  setSatelliteEnabled,
  onFlyToRegion
}) {
  const [activePanel, setActivePanel] = useState(null)
  const [visiblePanel, setVisiblePanel] = useState(null)
  const [isPanelHovered, setIsPanelHovered] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const closeTimeoutRef = React.useRef(null)

  const buttonContainerStyle = {
    position: 'fixed',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }

  const buttonStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    width: '56px',
    height: '56px',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '24px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const panelContainerStyle = {
    position: 'fixed',
    left: visiblePanel ? '88px' : '-400px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 9,
    width: '360px',
    maxHeight: '80vh',
    overflowY: 'auto',
    padding: '16px',
    transition: 'left 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  }

  const getButtonColor = (panel) => {
    if (activePanel === panel) {
      return satelliteEnabled ? '#ff0080' : '#00e6ff'
    }
    return '#ffffff'
  }
  
  const handleButtonEnter = (panel) => {
    // Cancel any pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    
    // If switching between panels, trigger morph transition
    if (activePanel && activePanel !== panel && visiblePanel) {
      setIsTransitioning(true)
      
      // Morph out current panel
      setTimeout(() => {
        setActivePanel(panel)
        // Morph in new panel
        setTimeout(() => {
          setIsTransitioning(false)
        }, 50)
      }, 250)
    } else {
      // First time opening
      setIsTransitioning(false)
      setActivePanel(panel)
      // Wait a frame before making visible to ensure content is rendered
      requestAnimationFrame(() => {
        setVisiblePanel(panel)
      })
    }
    
    setIsPanelHovered(false)
  }
  
  const handleButtonLeave = () => {
    // Elegant delay before closing
    closeTimeoutRef.current = setTimeout(() => {
      if (!isPanelHovered) {
        setVisiblePanel(null)
        // Wait for animation to complete before removing content
        setTimeout(() => setActivePanel(null), 500)
      }
    }, 400)
  }
  
  const handlePanelEnter = () => {
    // Cancel close when entering panel
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setIsPanelHovered(true)
  }
  
  const handlePanelMouseLeave = () => {
    setIsPanelHovered(false)
    // Elegant delay before closing
    closeTimeoutRef.current = setTimeout(() => {
      setVisiblePanel(null)
      // Wait for animation to complete before removing content
      setTimeout(() => setActivePanel(null), 500)
    }, 400)
  }

  return (
    <>
      <style>{`
        .sidebar-panel::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Buttons */}
      <div style={buttonContainerStyle}>
        <div
          style={{ ...buttonStyle, color: getButtonColor('controls') }}
          onMouseEnter={() => handleButtonEnter('controls')}
          onMouseLeave={handleButtonLeave}
          title="Steuerung"
        >
          ⚙️
        </div>
        
        <div
          style={{ ...buttonStyle, color: getButtonColor('search') }}
          onMouseEnter={() => handleButtonEnter('search')}
          onMouseLeave={handleButtonLeave}
          title="Rebsorten-Suche"
        >
          🍇
        </div>
      </div>

      {/* Panel Container */}
      <div 
        className="sidebar-panel"
        style={panelContainerStyle}
        onMouseEnter={handlePanelEnter}
        onMouseLeave={handlePanelMouseLeave}
      >
        <div style={{ 
          opacity: isTransitioning ? 0 : 1,
          transform: `scale(${isTransitioning ? 0.95 : 1})`,
          transition: 'opacity 0.25s ease, transform 0.25s ease'
        }}>
          {activePanel === 'controls' && (
            <ControlsPanel
              onZoomData={onZoomData}
              pointsVisible={pointsVisible}
              setPointsVisible={setPointsVisible}
              polysVisible={polysVisible}
              setPolysVisible={setPolysVisible}
              globeEnabled={globeEnabled}
              setGlobeEnabled={setGlobeEnabled}
              satelliteEnabled={satelliteEnabled}
              setSatelliteEnabled={setSatelliteEnabled}
            />
          )}
          
          {activePanel === 'search' && (
            <GrapeSearch
              satelliteEnabled={satelliteEnabled}
              onResultsFound={(results) => console.log('Found regions:', results)}
              onFlyToRegion={onFlyToRegion}
            />
          )}
        </div>
      </div>
    </>
  )
}

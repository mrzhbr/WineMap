export default function useMapboxToken(){
  return import.meta.env?.VITE_MAPBOX_TOKEN || ''
}

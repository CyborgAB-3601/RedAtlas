import React, { useState, useMemo } from 'react';

const LAYER_CONFIGS = {
  Satellite: {
    layerId: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
    ext: 'jpg',
    baseFallback: '/assets/nasa_jpl_marstrek_satellite_4k.jpg',
    maxZoom: 7
  },
  Elevation: {
    layerId: 'Mars_MGS_MOLA_ClrShade_merge_global_463m',
    ext: 'jpg',
    baseFallback: '/assets/nasa_jpl_marstrek_elevation_4k.jpg',
    maxZoom: 7
  },
  Thermal: {
    layerId: 'THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018',
    ext: 'png',
    baseFallback: '/assets/nasa_themis_thermal_4k.jpg',
    maxZoom: 9
  }
};

/**
 * High-performance Mars Trek WMTS Tiled Layer
 * Dynamically streams authentic NASA JPL Mars Trek tiles based on current zoom and viewport pan.
 */
export default function MarsTrekTiledLayer({
  viewMode = 'Satellite',
  zoomLevel = 1.0,
  pan = { x: 0, y: 0 },
  containerWidth = 1000,
  containerHeight = 600
}) {
  const currentConfig = LAYER_CONFIGS[viewMode] || LAYER_CONFIGS.Satellite;
  const [loadedTiles, setLoadedTiles] = useState({});

  // Determine optimal WMTS tile matrix zoom level (z)
  // z=1: 4x2, z=2: 8x4, z=3: 16x8, z=4: 32x16, z=5: 64x32
  const tileZoom = useMemo(() => {
    if (zoomLevel <= 1.25) return 2;
    if (zoomLevel <= 2.2) return 3;
    if (zoomLevel <= 3.6) return 4;
    return Math.min(5, currentConfig.maxZoom);
  }, [zoomLevel, currentConfig.maxZoom]);

  const numCols = Math.pow(2, tileZoom + 1);
  const numRows = Math.pow(2, tileZoom);

  // Exact visible tile range inside transformed container (50% 50% origin)
  const visibleTiles = useMemo(() => {
    const W = containerWidth || 1000;
    const H = containerHeight || 600;

    const pxMin = 0.5 + (-0.5 - pan.x / W) / zoomLevel;
    const pxMax = 0.5 + (0.5 - pan.x / W) / zoomLevel;
    const pyMin = 0.5 + (-0.5 - pan.y / H) / zoomLevel;
    const pyMax = 0.5 + (0.5 - pan.y / H) / zoomLevel;

    // Buffer of 1 tile on each side to avoid boundary pop-in
    const colMin = Math.max(0, Math.floor(pxMin * numCols) - 1);
    const colMax = Math.min(numCols - 1, Math.ceil(pxMax * numCols));
    const rowMin = Math.max(0, Math.floor(pyMin * numRows) - 1);
    const rowMax = Math.min(numRows - 1, Math.ceil(pyMax * numRows));

    const tiles = [];
    for (let r = rowMin; r <= rowMax; r++) {
      for (let c = colMin; c <= colMax; c++) {
        const key = `${tileZoom}_${r}_${c}`;
        const url = `https://trek.nasa.gov/tiles/Mars/EQ/${currentConfig.layerId}/1.0.0/default/default028mm/${tileZoom}/${r}/${c}.${currentConfig.ext}`;
        tiles.push({
          key,
          z: tileZoom,
          row: r,
          col: c,
          url,
          left: (c / numCols) * 100,
          top: (r / numRows) * 100,
          width: (1 / numCols) * 100 + 0.05, // Subtle overlap to eliminate sub-pixel seam gaps
          height: (1 / numRows) * 100 + 0.05
        });
      }
    }
    return tiles;
  }, [tileZoom, numCols, numRows, containerWidth, containerHeight, zoomLevel, pan.x, pan.y, currentConfig]);

  const handleTileLoad = (key) => {
    setLoadedTiles((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  return (
    <div
      className="mars-trek-tiled-container"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    >
      {/* 1. Underlying Base Mosaic (Guarantees instant display without flashes) */}
      <img
        src={currentConfig.baseFallback}
        alt={`Mars Trek Global Base - ${viewMode}`}
        className="mars-orbital-img"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      {/* 2. NASA JPL Mars Trek Dynamic WMTS Deep-Zoom Tiles */}
      {visibleTiles.map((tile) => (
        <img
          key={`${currentConfig.layerId}_${tile.key}`}
          src={tile.url}
          alt=""
          loading="lazy"
          draggable={false}
          onLoad={() => handleTileLoad(tile.key)}
          style={{
            position: 'absolute',
            left: `${tile.left}%`,
            top: `${tile.top}%`,
            width: `${tile.width}%`,
            height: `${tile.height}%`,
            objectFit: 'cover',
            opacity: loadedTiles[tile.key] ? 1 : 0,
            transition: 'opacity 0.25s ease-out',
            imageRendering: 'auto'
          }}
        />
      ))}
    </div>
  );
}

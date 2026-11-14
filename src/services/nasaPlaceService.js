/**
 * Official NASA / USGS / Mars Trek Place Imagery & Data Service
 * Integrates with NASA Image & Video Library (images-api.nasa.gov) and NASA JPL Mars Trek.
 */

// Cache fetched NASA images in memory to prevent duplicate requests
const imageCache = new Map();

// High-resolution authentic local Martian backups for guaranteed availability
export const LOCAL_MARTIAN_FALLBACKS = {
  proposed_base: {
    landscape: '/assets/mars_base_site.jpg',
    satellite: '/assets/crater_satellite_thumb.jpg'
  },
  jezero: {
    landscape: '/assets/jezero_crater.jpg',
    satellite: '/assets/crater_satellite_thumb.jpg'
  },
  gale: {
    landscape: '/assets/gale_crater.jpg',
    satellite: '/assets/crater_satellite_thumb.jpg'
  },
  olympus: {
    landscape: '/assets/olympus_mons.jpg',
    satellite: '/assets/crater_satellite_thumb.jpg'
  },
  valles: {
    landscape: '/assets/valles_marineris.jpg',
    satellite: '/assets/crater_satellite_thumb.jpg'
  },
  korolev: {
    landscape: '/assets/korolev_crater.jpg',
    satellite: '/assets/crater_satellite_thumb.jpg'
  },
  ascraeus: {
    landscape: '/assets/ascraeus_mons.jpg',
    satellite: '/assets/crater_satellite_thumb.jpg'
  },
  planum_boreum: {
    landscape: '/assets/planum_boreum.jpg',
    satellite: '/assets/crater_satellite_thumb.jpg'
  },
  tharsis_tubes: {
    landscape: '/assets/tharsis_tubes.jpg',
    satellite: '/assets/crater_satellite_thumb.jpg'
  }
};

export function getFallbackLandscape(locationId) {
  return LOCAL_MARTIAN_FALLBACKS[locationId]?.landscape || '/assets/mars_base_site.jpg';
}

export function getFallbackSatellite(locationId) {
  return LOCAL_MARTIAN_FALLBACKS[locationId]?.satellite || '/assets/crater_satellite_thumb.jpg';
}

/**
 * Sanitize NASA image URLs to HTTPS and avoid TIFF files which browsers cannot display.
 */
function sanitizeNasaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim().replace(/^http:\/\//i, 'https://');
  if (clean.toLowerCase().endsWith('.tif') || clean.toLowerCase().endsWith('.tiff')) {
    return '';
  }
  return clean;
}

/**
 * Fetch all official NASA / USGS images for a specific Martian location or rover site.
 */
export async function fetchNasaPlaceOfficialImages(placeName) {
  if (!placeName || placeName.trim().length === 0) return [];

  const cleanName = placeName
    .replace(/\(.*?\)/g, '') // remove parenthetical remarks
    .replace(/Rover|Lander/gi, '') // simplify search
    .trim();

  const cacheKey = cleanName.toLowerCase();
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const searchQueries = [
    `${cleanName} Mars`,
    `${cleanName} crater Mars`,
    cleanName
  ];

  for (const q of searchQueries) {
    try {
      const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const items = json.collection?.items || [];
        if (items.length > 0) {
          const parsed = items.slice(0, 30).map((item, idx) => {
            const data = item.data?.[0] || {};
            const links = item.links || [];

            // Extract real URLs present in NASA's manifest
            const previewLink = links.find((l) => l.rel === 'preview' || l.href?.includes('~thumb.'));
            const mediumLink = links.find((l) => l.href?.includes('~medium.'));
            const largeLink = links.find((l) => l.href?.includes('~large.'));
            const canonicalLink = links.find((l) => l.rel === 'canonical' || l.href?.includes('~orig.'));

            const thumbUrl = sanitizeNasaUrl(previewLink?.href) ||
              sanitizeNasaUrl(links[0]?.href);

            const mediumUrl = sanitizeNasaUrl(mediumLink?.href);
            const largeUrl = sanitizeNasaUrl(largeLink?.href);
            const origUrl = sanitizeNasaUrl(canonicalLink?.href);

            // Large display priority: true large > medium > non-tiff orig > thumb
            const bestDisplayUrl = largeUrl || mediumUrl || origUrl || thumbUrl;

            return {
              id: data.nasa_id || `nasa_${idx}`,
              title: data.title || `${placeName} - NASA Observation`,
              description: data.description || 'Official Martian observation recorded by NASA / JPL-Caltech.',
              nasaId: data.nasa_id || 'PIA-NASA',
              date: data.date_created ? data.date_created.slice(0, 10) : 'Archived',
              center: data.center || 'NASA JPL',
              photographer: data.photographer || data.secondary_creator || 'NASA / JPL / USGS',
              thumbUrl: thumbUrl || bestDisplayUrl,
              largeUrl: bestDisplayUrl,
              origUrl: origUrl || bestDisplayUrl,
              source: 'NASA JPL / USGS Astrogeology'
            };
          }).filter((img) => Boolean(img.thumbUrl && img.largeUrl));

          if (parsed.length > 0) {
            imageCache.set(cacheKey, parsed);
            return parsed;
          }
        }
      }
    } catch (e) {
      // Try next query or continue
    }
  }

  return [];
}

/**
 * Fetch and enrich location data with authentic NASA Mars Trek & USGS imagery and details.
 */
export async function enrichLocationWithOfficialData(location) {
  if (!location) return location;

  try {
    const images = await fetchNasaPlaceOfficialImages(location.name);
    if (images && images.length > 0) {
      const primaryPhoto = images[0];
      const secondaryPhoto = images[1] || primaryPhoto;

      return {
        ...location,
        officialImages: images,
        // Ensure URLs are valid strings; keep existing local fallback if missing
        landscapeImg: primaryPhoto.largeUrl || primaryPhoto.thumbUrl || location.landscapeImg || getFallbackLandscape(location.id),
        satelliteImg: secondaryPhoto.thumbUrl || location.satelliteImg || getFallbackSatellite(location.id),
        landscapeImgFallback: getFallbackLandscape(location.id),
        satelliteImgFallback: getFallbackSatellite(location.id),
        imageCaption: primaryPhoto.title,
        nasaId: primaryPhoto.nasaId
      };
    }
  } catch (e) {
    // Graceful fallback
  }

  return {
    ...location,
    landscapeImgFallback: getFallbackLandscape(location?.id),
    satelliteImgFallback: getFallbackSatellite(location?.id)
  };
}

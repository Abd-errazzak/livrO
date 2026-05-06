// ── Static city coordinates (fallback) ────────────────────────
const CITY_COORDS = {
  "casablanca":  [33.5731, -7.5898],
  "rabat":       [34.0209, -6.8416],
  "fès":         [34.0181, -5.0078],
  "fes":         [34.0181, -5.0078],
  "marrakech":   [31.6295, -7.9811],
  "tanger":      [35.7595, -5.8340],
  "agadir":      [30.4278, -9.5981],
  "meknès":      [33.8935, -5.5473],
  "meknes":      [33.8935, -5.5473],
  "oujda":       [34.6814, -1.9086],
  "kenitra":     [34.2610, -6.5802],
  "tétouan":     [35.5785, -5.3684],
  "tetouan":     [35.5785, -5.3684],
  "safi":        [32.2994, -9.2372],
  "el jadida":   [33.2316, -8.5007],
  "beni mellal": [32.3373, -6.3498],
  "nador":       [35.1740, -2.9287],
  "settat":      [33.0010, -7.6162],
  "taza":        [34.2100, -4.0100],
  "essaouira":   [31.5085, -9.7595],
  "laayoune":    [27.1536, -13.2033],
  "dakhla":      [23.6848, -15.9572],
  "ifrane":      [33.5228, -5.1073],
};

export function getCoords(cityName) {
  if (!cityName) return [31.7917, -7.0926];
  return CITY_COORDS[cityName.toLowerCase().trim()] || [31.7917, -7.0926];
}

// ── Extract exact lat/lng from any Google Maps URL ─────────────
export function extractCoordsFromUrl(url) {
  if (!url) return null;
  try {
    // @lat,lng,zoom  — most common share format
    let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];

    // !3dlat!4dlng  — embedded/directions format
    m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];

    // ?q=lat,lng
    m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];

    // ?ll=lat,lng
    m = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];

    // /place/lat,lng
    m = url.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];

  } catch (e) { /* ignore */ }
  return null;
}

// ── Best coords: URL first, then city name ─────────────────────
export function getBestCoords(mapsUrl, cityName) {
  const fromUrl = extractCoordsFromUrl(mapsUrl);
  if (fromUrl) return { coords: fromUrl, exact: true };
  return { coords: getCoords(cityName), exact: false };
}

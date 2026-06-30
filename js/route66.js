'use strict';

// Historic U.S. Route 66 — Chicago, IL → Santa Monica, CA
// Simplified waypoint path (post-1937 alignment) + notable landmarks.
// Coordinates are approximate, suitable for an illustrative overlay.

const ROUTE_66 = {
  // Ordered [lat, lng] waypoints forming the polyline
  path: [
    [41.8757, -87.6244],   // Chicago, IL — start
    [41.5250, -88.0817],   // Joliet, IL
    [41.1306, -88.8290],   // Pontiac, IL
    [40.4842, -88.9937],   // Bloomington, IL
    [39.7817, -89.6501],   // Springfield, IL
    [39.1206, -90.1860],   // Litchfield, IL
    [38.6270, -90.1994],   // St. Louis, MO
    [38.2167, -91.1626],   // Cuba, MO
    [37.9514, -91.7713],   // Rolla, MO
    [37.2090, -93.2923],   // Springfield, MO
    [37.0842, -94.5133],   // Joplin, MO
    [36.6770, -95.2380],   // Vinita, OK
    [36.1540, -95.9928],   // Tulsa, OK
    [35.7479, -96.6695],   // Bristow, OK
    [35.4676, -97.5164],   // Oklahoma City, OK
    [35.5089, -98.9680],   // Clinton, OK
    [35.5072, -99.3326],   // Elk City, OK
    [35.2220, -101.8313],  // Amarillo, TX
    [35.2210, -102.4099],  // Vega, TX
    [35.1717, -103.7250],  // Tucumcari, NM
    [34.9384, -104.6819],  // Santa Rosa, NM
    [35.0844, -106.6504],  // Albuquerque, NM
    [35.0780, -108.2087],  // Grants, NM
    [35.5281, -108.7426],  // Gallup, NM
    [35.0242, -109.0451],  // Sanders, AZ (approx)
    [34.9022, -110.1665],  // Holbrook, AZ
    [34.9558, -110.6985],  // Winslow, AZ
    [35.1983, -111.6513],  // Flagstaff, AZ
    [35.2494, -112.1910],  // Williams, AZ
    [35.3258, -112.8769],  // Seligman, AZ
    [35.1894, -114.0530],  // Kingman, AZ
    [34.8481, -114.6141],  // Needles, CA
    [34.8392, -115.6553],  // Amboy, CA (approx)
    [34.8958, -117.0173],  // Barstow, CA
    [34.5361, -117.2912],  // Victorville, CA
    [34.1083, -117.2898],  // San Bernardino, CA
    [34.1478, -118.1445],  // Pasadena, CA
    [34.0522, -118.2437],  // Los Angeles, CA
    [34.0195, -118.4912],  // Santa Monica, CA — end
  ],

  // Notable landmarks shown as special markers
  landmarks: [
    { name: 'Route 66 Begin Sign',  lat: 41.8757,  lng: -87.6244,  city: 'Chicago, IL',     note: 'The eastern starting point.' },
    { name: 'Gemini Giant',         lat: 41.2261,  lng: -88.2434,  city: 'Wilmington, IL',  note: 'Classic roadside Muffler Man.' },
    { name: 'Gateway Arch',         lat: 38.6247,  lng: -90.1848,  city: 'St. Louis, MO',   note: 'Gateway to the West.' },
    { name: 'Blue Whale',           lat: 36.2945,  lng: -95.5953,  city: 'Catoosa, OK',     note: 'Beloved roadside attraction.' },
    { name: 'Cadillac Ranch',       lat: 35.1872,  lng: -101.9871, city: 'Amarillo, TX',    note: 'Ten half-buried Cadillacs.' },
    { name: 'Blue Hole',            lat: 34.9417,  lng: -104.6794, city: 'Santa Rosa, NM',  note: 'Crystal-clear desert spring.' },
    { name: 'Wigwam Motel',         lat: 34.9047,  lng: -110.1545, city: 'Holbrook, AZ',    note: 'Sleep in a concrete teepee.' },
    { name: 'Standin on the Corner',lat: 35.0242,  lng: -110.6974, city: 'Winslow, AZ',     note: 'Such a fine sight to see.' },
    { name: 'Seligman',             lat: 35.3258,  lng: -112.8769, city: 'Seligman, AZ',    note: 'Birthplace of Historic Route 66.' },
    { name: 'Santa Monica Pier',    lat: 34.0094,  lng: -118.4973, city: 'Santa Monica, CA',note: 'End of the Trail.' },
  ],
};

'use strict';

const ExifHandler = {
  extract(file) {
    return new Promise((resolve) => {
      if (typeof EXIF === 'undefined') {
        resolve({});
        return;
      }
      try {
        EXIF.getData(file, function () {
          const all = EXIF.getAllTags(this) || {};
          resolve({
            date:        ExifHandler._parseDate(all.DateTimeOriginal || all.DateTime),
            camera:      ExifHandler._parseCamera(all.Make, all.Model),
            focalLength: ExifHandler._parseRational(all.FocalLength),
            iso:         Array.isArray(all.ISOSpeedRatings)
                           ? all.ISOSpeedRatings[0]
                           : (all.ISOSpeedRatings || null),
            aperture:    ExifHandler._parseAperture(all.FNumber),
            shutter:     ExifHandler._parseShutter(all.ExposureTime),
            lat:         ExifHandler._parseGPS(all.GPSLatitude, all.GPSLatitudeRef),
            lng:         ExifHandler._parseGPS(all.GPSLongitude, all.GPSLongitudeRef),
          });
        });
      } catch {
        resolve({});
      }
    });
  },

  _parseDate(raw) {
    if (!raw) return null;
    const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  },

  _parseCamera(make, model) {
    const m = (make  || '').trim();
    const mo = (model || '').trim();
    if (!m && !mo) return null;
    if (!mo)  return m;
    // avoid "NIKON CORPORATION NIKON D750" → keep model if it already contains the brand word
    const firstWord = m.split(/\s+/)[0].toLowerCase();
    return mo.toLowerCase().includes(firstWord) ? mo : `${m} ${mo}`;
  },

  _parseRational(r) {
    if (!r || !r.denominator) return null;
    return Math.round(r.numerator / r.denominator);
  },

  _parseAperture(r) {
    if (!r || !r.denominator) return null;
    const val = r.numerator / r.denominator;
    return val.toFixed(1).replace(/\.0$/, '');
  },

  _parseShutter(r) {
    if (!r || !r.denominator) return null;
    const val = r.numerator / r.denominator;
    if (val >= 1) return `${Math.round(val)}s`;
    return `1/${Math.round(1 / val)}`;
  },

  _parseGPS(coords, ref) {
    if (!coords || !Array.isArray(coords) || coords.length < 3) return null;
    const deg = coords[0].numerator / coords[0].denominator;
    const min = coords[1].numerator / coords[1].denominator;
    const sec = coords[2].numerator / coords[2].denominator;
    let dd = deg + min / 60 + sec / 3600;
    if (ref === 'S' || ref === 'W') dd = -dd;
    return parseFloat(dd.toFixed(6));
  },
};

/* Single Source of Truth für die unterstützten Medientypen (Backend-Seite).
   Das Frontend-Pendant ist TYPE_META in public/js/types.js. */
const MEDIA_TYPES = ['anime', 'manga', 'movie', 'tv', 'game'];

function isMediaType(type)
{
  return MEDIA_TYPES.includes(type);
}

module.exports = { MEDIA_TYPES, isMediaType };

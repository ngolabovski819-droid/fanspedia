/**
 * SSR handler for /es/country/:name pages
 *
 * Spanish mirror of api/ssr/country.js.
 * Differences vs the EN handler:
 *   - Templates: es/<country>.html  (already have lang="es")
 *   - Spanish titles are already set in the templates; SSR updates canonical
 *   - Canonical URL under /es/country/
 *   - hreflang="en" + hreflang="es" cross-links (prevents Google dedup)
 *   - JSON-LD breadcrumbs use /es/ paths
 *   - Fallback: redirect to /es/<country>.html
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const BASE_URL = 'https://fanspedia.net';
const PAGE_SIZE = 50;
const YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Country config map (Spanish labels + metadata)
// ---------------------------------------------------------------------------
const COUNTRIES = {
  'united-states': {
    terms: ['united states', 'usa', 'america', 'american'],
    label: 'Estados Unidos',
    htmlFile: 'es/united-states.html',
    h1: 'Las Mejores Creadoras de OnlyFans en Estados Unidos',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares en Estados Unidos. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras americanas.',
    titleEs: `Mejores Creadoras de OnlyFans en Estados Unidos (${YEAR}) | FansPedia`,
  },
  canada: {
    terms: ['canada', 'canadian'],
    label: 'Canadá',
    htmlFile: 'es/canada.html',
    h1: 'Las Mejores Creadoras de OnlyFans en Canadá',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares en Canadá. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras canadienses.',
    titleEs: `Mejores Creadoras de OnlyFans en Canadá (${YEAR}) | FansPedia`,
  },
  argentina: {
    terms: ['argentina', 'argentinian', 'argentine', 'buenos aires'],
    label: 'Argentina',
    htmlFile: 'es/argentina.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Argentina',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Argentina. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras argentinas.',
    titleEs: `Mejores Creadoras de OnlyFans de Argentina (${YEAR}) | FansPedia`,
  },
  'united-kingdom': {
    terms: ['united kingdom', 'uk', 'british', 'england', 'english', 'wales', 'welsh', 'scotland', 'scottish'],
    label: 'Reino Unido',
    htmlFile: 'es/united-kingdom.html',
    h1: 'Las Mejores Creadoras de OnlyFans del Reino Unido',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares del Reino Unido. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras británicas.',
    titleEs: `Mejores Creadoras de OnlyFans del Reino Unido (${YEAR}) | FansPedia`,
  },
  philippines: {
    terms: ['philippines', 'philippine', 'filipina', 'filipinas'],
    label: 'Filipinas',
    htmlFile: 'es/philippines.html',
    h1: 'Las Mejores Creadoras de OnlyFans en Filipinas',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares en Filipinas. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras filipinas.',
    titleEs: `Mejores Creadoras de OnlyFans en Filipinas (${YEAR}) | FansPedia`,
  },
  india: {
    terms: ['india', 'indian'],
    label: 'India',
    htmlFile: 'es/india.html',
    h1: 'Las Mejores Creadoras de OnlyFans en India',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares en India. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras de India.',
    titleEs: `Mejores Creadoras de OnlyFans en India (${YEAR}) | FansPedia`,
  },
  japan: {
    terms: ['japan', 'japanese'],
    label: 'Japón',
    htmlFile: 'es/japan.html',
    h1: 'Las Mejores Creadoras de OnlyFans en Japón',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares en Japón. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras japonesas.',
    titleEs: `Mejores Creadoras de OnlyFans en Japón (${YEAR}) | FansPedia`,
  },
  'armenia': {
    terms: ["armenia","armenian","yerevan"],
    label: 'Armenia',
    htmlFile: 'es/armenia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Armenia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Armenia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Armenia (${YEAR}) | FansPedia`,
  },
  'australia': {
    terms: ["australia","australian","sydney","melbourne","brisbane"],
    label: 'Australia',
    htmlFile: 'es/australia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Australia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Australia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Australia (${YEAR}) | FansPedia`,
  },
  'austria': {
    terms: ["austria","austrian","vienna","wien"],
    label: 'Austria',
    htmlFile: 'es/austria.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Austria',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Austria. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Austria (${YEAR}) | FansPedia`,
  },
  'bahamas': {
    terms: ["bahamas","bahamian","nassau"],
    label: 'Bahamas',
    htmlFile: 'es/bahamas.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Bahamas',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Bahamas. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Bahamas (${YEAR}) | FansPedia`,
  },
  'barbados': {
    terms: ["barbados","barbadian","bridgetown"],
    label: 'Barbados',
    htmlFile: 'es/barbados.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Barbados',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Barbados. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Barbados (${YEAR}) | FansPedia`,
  },
  'belarus': {
    terms: ["belarus","belarusian","minsk"],
    label: 'Bielorrusia',
    htmlFile: 'es/belarus.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Bielorrusia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Bielorrusia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Bielorrusia (${YEAR}) | FansPedia`,
  },
  'belgium': {
    terms: ["belgium","belgian","brussels"],
    label: 'Bélgica',
    htmlFile: 'es/belgium.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Bélgica',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Bélgica. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Bélgica (${YEAR}) | FansPedia`,
  },
  'bolivia': {
    terms: ["bolivia","bolivian","la paz","santa cruz"],
    label: 'Bolivia',
    htmlFile: 'es/bolivia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Bolivia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Bolivia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Bolivia (${YEAR}) | FansPedia`,
  },
  'bosnia-and-herzegovina': {
    terms: ["bosnia","bosnian","herzegovina","sarajevo"],
    label: 'Bosnia y Herzegovina',
    htmlFile: 'es/bosnia-and-herzegovina.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Bosnia y Herzegovina',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Bosnia y Herzegovina. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Bosnia y Herzegovina (${YEAR}) | FansPedia`,
  },
  'brazil': {
    terms: ["brazil","brazilian","brasil","rio de janeiro","sao paulo"],
    label: 'Brasil',
    htmlFile: 'es/brazil.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Brasil',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Brasil. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Brasil (${YEAR}) | FansPedia`,
  },
  'bulgaria': {
    terms: ["bulgaria","bulgarian","sofia"],
    label: 'Bulgaria',
    htmlFile: 'es/bulgaria.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Bulgaria',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Bulgaria. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Bulgaria (${YEAR}) | FansPedia`,
  },
  'cambodia': {
    terms: ["cambodia","cambodian","phnom penh"],
    label: 'Camboya',
    htmlFile: 'es/cambodia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Camboya',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Camboya. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Camboya (${YEAR}) | FansPedia`,
  },
  'chile': {
    terms: ["chile","chilean","santiago","chilena"],
    label: 'Chile',
    htmlFile: 'es/chile.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Chile',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Chile. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Chile (${YEAR}) | FansPedia`,
  },
  'china': {
    terms: ["china","chinese","beijing","shanghai"],
    label: 'China',
    htmlFile: 'es/china.html',
    h1: 'Las Mejores Creadoras de OnlyFans de China',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de China. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de China (${YEAR}) | FansPedia`,
  },
  'colombia': {
    terms: ["colombia","colombian","bogota","medellin","colombiana"],
    label: 'Colombia',
    htmlFile: 'es/colombia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Colombia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Colombia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Colombia (${YEAR}) | FansPedia`,
  },
  'costa-rica': {
    terms: ["costa rica","costa rican","san jose","tica"],
    label: 'Costa Rica',
    htmlFile: 'es/costa-rica.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Costa Rica',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Costa Rica. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Costa Rica (${YEAR}) | FansPedia`,
  },
  'croatia': {
    terms: ["croatia","croatian","zagreb"],
    label: 'Croacia',
    htmlFile: 'es/croatia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Croacia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Croacia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Croacia (${YEAR}) | FansPedia`,
  },
  'cuba': {
    terms: ["cuba","cuban","havana","cubana"],
    label: 'Cuba',
    htmlFile: 'es/cuba.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Cuba',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Cuba. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Cuba (${YEAR}) | FansPedia`,
  },
  'cyprus': {
    terms: ["cyprus","cypriot","nicosia"],
    label: 'Chipre',
    htmlFile: 'es/cyprus.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Chipre',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Chipre. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Chipre (${YEAR}) | FansPedia`,
  },
  'czech-republic': {
    terms: ["czech","czech republic","czechia","prague"],
    label: 'República Checa',
    htmlFile: 'es/czech-republic.html',
    h1: 'Las Mejores Creadoras de OnlyFans de República Checa',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de República Checa. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de República Checa (${YEAR}) | FansPedia`,
  },
  'denmark': {
    terms: ["denmark","danish","copenhagen"],
    label: 'Dinamarca',
    htmlFile: 'es/denmark.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Dinamarca',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Dinamarca. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Dinamarca (${YEAR}) | FansPedia`,
  },
  'dominican-republic': {
    terms: ["dominican","dominican republic","santo domingo","dominicana"],
    label: 'República Dominicana',
    htmlFile: 'es/dominican-republic.html',
    h1: 'Las Mejores Creadoras de OnlyFans de República Dominicana',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de República Dominicana. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de República Dominicana (${YEAR}) | FansPedia`,
  },
  'ecuador': {
    terms: ["ecuador","ecuadorian","quito","guayaquil","ecuatoriana"],
    label: 'Ecuador',
    htmlFile: 'es/ecuador.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Ecuador',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Ecuador. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Ecuador (${YEAR}) | FansPedia`,
  },
  'egypt': {
    terms: ["egypt","egyptian","cairo","alexandria"],
    label: 'Egipto',
    htmlFile: 'es/egypt.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Egipto',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Egipto. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Egipto (${YEAR}) | FansPedia`,
  },
  'el-salvador': {
    terms: ["el salvador","salvadoran","san salvador"],
    label: 'El Salvador',
    htmlFile: 'es/el-salvador.html',
    h1: 'Las Mejores Creadoras de OnlyFans de El Salvador',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de El Salvador. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de El Salvador (${YEAR}) | FansPedia`,
  },
  'estonia': {
    terms: ["estonia","estonian","tallinn"],
    label: 'Estonia',
    htmlFile: 'es/estonia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Estonia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Estonia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Estonia (${YEAR}) | FansPedia`,
  },
  'finland': {
    terms: ["finland","finnish","helsinki"],
    label: 'Finlandia',
    htmlFile: 'es/finland.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Finlandia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Finlandia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Finlandia (${YEAR}) | FansPedia`,
  },
  'france': {
    terms: ["france","french","paris","française"],
    label: 'Francia',
    htmlFile: 'es/france.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Francia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Francia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Francia (${YEAR}) | FansPedia`,
  },
  'georgia': {
    terms: ["georgia country","georgian","tbilisi"],
    label: 'Georgia',
    htmlFile: 'es/georgia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Georgia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Georgia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Georgia (${YEAR}) | FansPedia`,
  },
  'germany': {
    terms: ["germany","german","berlin","deutschland"],
    label: 'Alemania',
    htmlFile: 'es/germany.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Alemania',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Alemania. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Alemania (${YEAR}) | FansPedia`,
  },
  'ghana': {
    terms: ["ghana","ghanaian","accra"],
    label: 'Ghana',
    htmlFile: 'es/ghana.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Ghana',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Ghana. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Ghana (${YEAR}) | FansPedia`,
  },
  'greece': {
    terms: ["greece","greek","athens","hellenic"],
    label: 'Grecia',
    htmlFile: 'es/greece.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Grecia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Grecia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Grecia (${YEAR}) | FansPedia`,
  },
  'guam': {
    terms: ["guam","guamanian","chamorro"],
    label: 'Guam',
    htmlFile: 'es/guam.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Guam',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Guam. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Guam (${YEAR}) | FansPedia`,
  },
  'guatemala': {
    terms: ["guatemala","guatemalan","guatemalteca"],
    label: 'Guatemala',
    htmlFile: 'es/guatemala.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Guatemala',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Guatemala. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Guatemala (${YEAR}) | FansPedia`,
  },
  'honduras': {
    terms: ["honduras","honduran","tegucigalpa","hondureña"],
    label: 'Honduras',
    htmlFile: 'es/honduras.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Honduras',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Honduras. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Honduras (${YEAR}) | FansPedia`,
  },
  'hong-kong': {
    terms: ["hong kong","hongkong","hk"],
    label: 'Hong Kong',
    htmlFile: 'es/hong-kong.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Hong Kong',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Hong Kong. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Hong Kong (${YEAR}) | FansPedia`,
  },
  'hungary': {
    terms: ["hungary","hungarian","budapest"],
    label: 'Hungría',
    htmlFile: 'es/hungary.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Hungría',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Hungría. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Hungría (${YEAR}) | FansPedia`,
  },
  'iceland': {
    terms: ["iceland","icelandic","reykjavik"],
    label: 'Islandia',
    htmlFile: 'es/iceland.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Islandia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Islandia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Islandia (${YEAR}) | FansPedia`,
  },
  'indonesia': {
    terms: ["indonesia","indonesian","jakarta","bali"],
    label: 'Indonesia',
    htmlFile: 'es/indonesia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Indonesia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Indonesia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Indonesia (${YEAR}) | FansPedia`,
  },
  'ireland': {
    terms: ["ireland","irish","dublin"],
    label: 'Irlanda',
    htmlFile: 'es/ireland.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Irlanda',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Irlanda. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Irlanda (${YEAR}) | FansPedia`,
  },
  'israel': {
    terms: ["israel","israeli","tel aviv","jerusalem"],
    label: 'Israel',
    htmlFile: 'es/israel.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Israel',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Israel. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Israel (${YEAR}) | FansPedia`,
  },
  'italy': {
    terms: ["italy","italian","rome","milan","italia","italiana"],
    label: 'Italia',
    htmlFile: 'es/italy.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Italia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Italia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Italia (${YEAR}) | FansPedia`,
  },
  'jamaica': {
    terms: ["jamaica","jamaican","kingston"],
    label: 'Jamaica',
    htmlFile: 'es/jamaica.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Jamaica',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Jamaica. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Jamaica (${YEAR}) | FansPedia`,
  },
  'kenya': {
    terms: ["kenya","kenyan","nairobi"],
    label: 'Kenia',
    htmlFile: 'es/kenya.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Kenia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Kenia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Kenia (${YEAR}) | FansPedia`,
  },
  'latvia': {
    terms: ["latvia","latvian","riga"],
    label: 'Letonia',
    htmlFile: 'es/latvia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Letonia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Letonia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Letonia (${YEAR}) | FansPedia`,
  },
  'lebanon': {
    terms: ["lebanon","lebanese","beirut"],
    label: 'Líbano',
    htmlFile: 'es/lebanon.html',
    h1: 'Las Mejores Creadoras de OnlyFans del Líbano',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares del Líbano. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans del Líbano (${YEAR}) | FansPedia`,
  },
  'lithuania': {
    terms: ["lithuania","lithuanian","vilnius"],
    label: 'Lituania',
    htmlFile: 'es/lithuania.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Lituania',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Lituania. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Lituania (${YEAR}) | FansPedia`,
  },
  'luxembourg': {
    terms: ["luxembourg","luxembourgish"],
    label: 'Luxemburgo',
    htmlFile: 'es/luxembourg.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Luxemburgo',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Luxemburgo. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Luxemburgo (${YEAR}) | FansPedia`,
  },
  'malaysia': {
    terms: ["malaysia","malaysian","kuala lumpur"],
    label: 'Malasia',
    htmlFile: 'es/malaysia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Malasia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Malasia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Malasia (${YEAR}) | FansPedia`,
  },
  'malta': {
    terms: ["malta","maltese","valletta"],
    label: 'Malta',
    htmlFile: 'es/malta.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Malta',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Malta. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Malta (${YEAR}) | FansPedia`,
  },
  'mexico': {
    terms: ["mexico","mexican","mexico city","guadalajara","mexicana"],
    label: 'México',
    htmlFile: 'es/mexico.html',
    h1: 'Las Mejores Creadoras de OnlyFans de México',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de México. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de México (${YEAR}) | FansPedia`,
  },
  'moldova': {
    terms: ["moldova","moldovan","chisinau"],
    label: 'Moldavia',
    htmlFile: 'es/moldova.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Moldavia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Moldavia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Moldavia (${YEAR}) | FansPedia`,
  },
  'monaco': {
    terms: ["monaco","monegasque","monte carlo"],
    label: 'Mónaco',
    htmlFile: 'es/monaco.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Mónaco',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Mónaco. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Mónaco (${YEAR}) | FansPedia`,
  },
  'montenegro': {
    terms: ["montenegro","montenegrin","podgorica"],
    label: 'Montenegro',
    htmlFile: 'es/montenegro.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Montenegro',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Montenegro. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Montenegro (${YEAR}) | FansPedia`,
  },
  'morocco': {
    terms: ["morocco","moroccan","casablanca","marrakech"],
    label: 'Marruecos',
    htmlFile: 'es/morocco.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Marruecos',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Marruecos. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Marruecos (${YEAR}) | FansPedia`,
  },
  'netherlands': {
    terms: ["netherlands","dutch","holland","amsterdam"],
    label: 'Países Bajos',
    htmlFile: 'es/netherlands.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Países Bajos',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Países Bajos. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Países Bajos (${YEAR}) | FansPedia`,
  },
  'new-zealand': {
    terms: ["new zealand","nz","kiwi","auckland","wellington"],
    label: 'Nueva Zelanda',
    htmlFile: 'es/new-zealand.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Nueva Zelanda',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Nueva Zelanda. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Nueva Zelanda (${YEAR}) | FansPedia`,
  },
  'nigeria': {
    terms: ["nigeria","nigerian","lagos","abuja"],
    label: 'Nigeria',
    htmlFile: 'es/nigeria.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Nigeria',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Nigeria. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Nigeria (${YEAR}) | FansPedia`,
  },
  'norway': {
    terms: ["norway","norwegian","oslo"],
    label: 'Noruega',
    htmlFile: 'es/norway.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Noruega',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Noruega. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Noruega (${YEAR}) | FansPedia`,
  },
  'pakistan': {
    terms: ["pakistan","pakistani","karachi","lahore","islamabad"],
    label: 'Pakistán',
    htmlFile: 'es/pakistan.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Pakistán',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Pakistán. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Pakistán (${YEAR}) | FansPedia`,
  },
  'panama': {
    terms: ["panama","panamanian","panama city","panameña"],
    label: 'Panamá',
    htmlFile: 'es/panama.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Panamá',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Panamá. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Panamá (${YEAR}) | FansPedia`,
  },
  'paraguay': {
    terms: ["paraguay","paraguayan","asuncion","paraguaya"],
    label: 'Paraguay',
    htmlFile: 'es/paraguay.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Paraguay',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Paraguay. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Paraguay (${YEAR}) | FansPedia`,
  },
  'peru': {
    terms: ["peru","peruvian","lima","peruana"],
    label: 'Perú',
    htmlFile: 'es/peru.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Perú',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Perú. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Perú (${YEAR}) | FansPedia`,
  },
  'poland': {
    terms: ["poland","polish","warsaw","krakow","polska"],
    label: 'Polonia',
    htmlFile: 'es/poland.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Polonia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Polonia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Polonia (${YEAR}) | FansPedia`,
  },
  'portugal': {
    terms: ["portugal","portuguese","lisbon","porto","portuguesa"],
    label: 'Portugal',
    htmlFile: 'es/portugal.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Portugal',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Portugal. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Portugal (${YEAR}) | FansPedia`,
  },
  'puerto-rico': {
    terms: ["puerto rico","puerto rican","san juan","boricua"],
    label: 'Puerto Rico',
    htmlFile: 'es/puerto-rico.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Puerto Rico',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Puerto Rico. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Puerto Rico (${YEAR}) | FansPedia`,
  },
  'romania': {
    terms: ["romania","romanian","bucharest"],
    label: 'Rumania',
    htmlFile: 'es/romania.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Rumania',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Rumania. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Rumania (${YEAR}) | FansPedia`,
  },
  'russia': {
    terms: ["russia","russian","moscow","saint petersburg"],
    label: 'Rusia',
    htmlFile: 'es/russia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Rusia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Rusia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Rusia (${YEAR}) | FansPedia`,
  },
  'saudi-arabia': {
    terms: ["saudi arabia","saudi","riyadh","jeddah"],
    label: 'Arabia Saudita',
    htmlFile: 'es/saudi-arabia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Arabia Saudita',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Arabia Saudita. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Arabia Saudita (${YEAR}) | FansPedia`,
  },
  'scotland': {
    terms: ["scotland","scottish","edinburgh","glasgow"],
    label: 'Escocia',
    htmlFile: 'es/scotland.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Escocia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Escocia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Escocia (${YEAR}) | FansPedia`,
  },
  'serbia': {
    terms: ["serbia","serbian","belgrade"],
    label: 'Serbia',
    htmlFile: 'es/serbia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Serbia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Serbia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Serbia (${YEAR}) | FansPedia`,
  },
  'singapore': {
    terms: ["singapore","singaporean"],
    label: 'Singapur',
    htmlFile: 'es/singapore.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Singapur',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Singapur. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Singapur (${YEAR}) | FansPedia`,
  },
  'slovakia': {
    terms: ["slovakia","slovak","bratislava"],
    label: 'Eslovaquia',
    htmlFile: 'es/slovakia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Eslovaquia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Eslovaquia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Eslovaquia (${YEAR}) | FansPedia`,
  },
  'slovenia': {
    terms: ["slovenia","slovenian","ljubljana"],
    label: 'Eslovenia',
    htmlFile: 'es/slovenia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Eslovenia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Eslovenia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Eslovenia (${YEAR}) | FansPedia`,
  },
  'south-africa': {
    terms: ["south africa","south african","cape town","johannesburg"],
    label: 'Sudáfrica',
    htmlFile: 'es/south-africa.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Sudáfrica',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Sudáfrica. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Sudáfrica (${YEAR}) | FansPedia`,
  },
  'south-korea': {
    terms: ["south korea","korean","seoul","kpop","k-pop"],
    label: 'Corea del Sur',
    htmlFile: 'es/south-korea.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Corea del Sur',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Corea del Sur. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Corea del Sur (${YEAR}) | FansPedia`,
  },
  'spain': {
    terms: ["spain","spanish","madrid","barcelona","española"],
    label: 'España',
    htmlFile: 'es/spain.html',
    h1: 'Las Mejores Creadoras de OnlyFans de España',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de España. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de España (${YEAR}) | FansPedia`,
  },
  'sri-lanka': {
    terms: ["sri lanka","sri lankan","colombo","ceylon"],
    label: 'Sri Lanka',
    htmlFile: 'es/sri-lanka.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Sri Lanka',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Sri Lanka. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Sri Lanka (${YEAR}) | FansPedia`,
  },
  'sweden': {
    terms: ["sweden","swedish","stockholm"],
    label: 'Suecia',
    htmlFile: 'es/sweden.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Suecia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Suecia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Suecia (${YEAR}) | FansPedia`,
  },
  'switzerland': {
    terms: ["switzerland","swiss","zurich","geneva"],
    label: 'Suiza',
    htmlFile: 'es/switzerland.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Suiza',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Suiza. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Suiza (${YEAR}) | FansPedia`,
  },
  'taiwan': {
    terms: ["taiwan","taiwanese","taipei"],
    label: 'Taiwán',
    htmlFile: 'es/taiwan.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Taiwán',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Taiwán. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Taiwán (${YEAR}) | FansPedia`,
  },
  'thailand': {
    terms: ["thailand","thai","bangkok"],
    label: 'Tailandia',
    htmlFile: 'es/thailand.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Tailandia',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Tailandia. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Tailandia (${YEAR}) | FansPedia`,
  },
  'trinidad-and-tobago': {
    terms: ["trinidad","tobago","trinidadian","port of spain"],
    label: 'Trinidad y Tobago',
    htmlFile: 'es/trinidad-and-tobago.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Trinidad y Tobago',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Trinidad y Tobago. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Trinidad y Tobago (${YEAR}) | FansPedia`,
  },
  'tunisia': {
    terms: ["tunisia","tunisian","tunis"],
    label: 'Túnez',
    htmlFile: 'es/tunisia.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Túnez',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Túnez. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Túnez (${YEAR}) | FansPedia`,
  },
  'turkey': {
    terms: ["turkey","turkish","istanbul","ankara"],
    label: 'Turquía',
    htmlFile: 'es/turkey.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Turquía',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Turquía. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Turquía (${YEAR}) | FansPedia`,
  },
  'ukraine': {
    terms: ["ukraine","ukrainian","kyiv","odessa"],
    label: 'Ucrania',
    htmlFile: 'es/ukraine.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Ucrania',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Ucrania. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Ucrania (${YEAR}) | FansPedia`,
  },
  'united-arab-emirates': {
    terms: ["uae","emirates","dubai","abu dhabi"],
    label: 'Emiratos Árabes Unidos',
    htmlFile: 'es/united-arab-emirates.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Emiratos Árabes Unidos',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Emiratos Árabes Unidos. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Emiratos Árabes Unidos (${YEAR}) | FansPedia`,
  },
  'uruguay': {
    terms: ["uruguay","uruguayan","montevideo","uruguaya"],
    label: 'Uruguay',
    htmlFile: 'es/uruguay.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Uruguay',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Uruguay. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Uruguay (${YEAR}) | FansPedia`,
  },
  'venezuela': {
    terms: ["venezuela","venezuelan","caracas","venezolana"],
    label: 'Venezuela',
    htmlFile: 'es/venezuela.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Venezuela',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Venezuela. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Venezuela (${YEAR}) | FansPedia`,
  },
  'vietnam': {
    terms: ["vietnam","vietnamese","ho chi minh","hanoi"],
    label: 'Vietnam',
    htmlFile: 'es/vietnam.html',
    h1: 'Las Mejores Creadoras de OnlyFans de Vietnam',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares de Vietnam. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: `Mejores Creadoras de OnlyFans de Vietnam (${YEAR}) | FansPedia`,
  },
};

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------
function proxyImg(url, w, h) {
  try {
    if (!url || url.startsWith('/static/')) return url;
    const noScheme = url.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(noScheme)}&w=${w}&h=${h}&fit=cover&output=webp`;
  } catch { return url; }
}

function buildResponsiveSources(originalUrl) {
  const widths = [144, 240, 320, 480, 720];
  const srcset = widths
    .map(w => `${proxyImg(originalUrl, w, Math.round(w * 4 / 3))} ${w}w`)
    .join(', ');
  const src = proxyImg(originalUrl, 320, Math.round(320 * 4 / 3));
  const sizes = '(max-width: 480px) 144px, (max-width: 768px) 240px, (max-width: 1200px) 320px, 360px';
  return { src, srcset, sizes };
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Card renderer
// ---------------------------------------------------------------------------
function renderCard(item, index) {
  const img = item.avatar || item.avatar_c144 || '';
  const imgSrc = img && img.startsWith('http') ? img : '/static/no-image.png';
  const { src, srcset, sizes } = buildResponsiveSources(imgSrc);

  const name = escHtml(item.name || 'Unknown');
  const username = escHtml(item.username || '');
  const subscribePrice = item.subscribePrice ?? item.subscribeprice;
  const priceText = (subscribePrice && !isNaN(subscribePrice))
    ? `$${parseFloat(subscribePrice).toFixed(2)}`
    : 'GRATIS';
  const isVerified = item.isVerified ?? item.isverified;
  const verifiedBadge = isVerified ? '<span aria-label="Verificado" title="Creadora verificada">✓ </span>' : '';
  const profileUrl = username ? `https://onlyfans.com/${encodeURIComponent(username)}` : '#';
  const loading = index === 0 ? 'eager' : 'lazy';
  const fetchpriority = index === 0 ? ' fetchpriority="high"' : '';
  const priceHtml = priceText === 'GRATIS'
    ? `<p class="price-free" style="color:#34c759;font-weight:700;font-size:16px;text-transform:uppercase;">GRATIS</p>`
    : `<p class="price-tag" style="color:#34c759;font-weight:700;font-size:18px;">${priceText}</p>`;

  return `<div class="col-sm-6 col-md-4 col-lg-3 mb-4">
  <div class="card h-100">
    <button class="favorite-btn" data-username="${username}" onclick="event.preventDefault();toggleFavorite('${username}',this);">
      <span>♡</span>
    </button>
    <div class="card-img-wrap">
      <img src="${src}" srcset="${srcset}" sizes="${sizes}"
        alt="${name} creadora de OnlyFans" loading="${loading}"${fetchpriority}
        decoding="async" referrerpolicy="no-referrer"
        onerror="if(this.src!=='/static/no-image.png'){this.removeAttribute('srcset');this.removeAttribute('sizes');this.src='${escHtml(imgSrc)}';this.style.opacity='0.4';}">
    </div>
    <div class="card-body">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:4px;">${verifiedBadge}${name}</h3>
      <p class="username">@${username}</p>
      ${priceHtml}
      <a href="${escHtml(profileUrl)}" class="view-profile-btn" target="_blank" rel="noopener noreferrer">Ver Perfil</a>
    </div>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// JSON-LD structured data
// ---------------------------------------------------------------------------
function buildJsonLd(name, label, creators, canonicalUrl) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE_URL}/es/` },
      { '@type': 'ListItem', position: 2, name: 'Países', item: `${BASE_URL}/es/` },
      { '@type': 'ListItem', position: 3, name: label, item: canonicalUrl },
    ],
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Mejores Creadoras de OnlyFans en ${label} (${YEAR})`,
    url: canonicalUrl,
    numberOfItems: creators.length,
    itemListElement: creators.slice(0, 10).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: escHtml(c.name || c.username),
      url: `https://onlyfans.com/${encodeURIComponent(c.username)}`,
    })),
  };
  return [
    `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(itemList)}</script>`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const name = (req.query.name || '').toLowerCase().trim();
  if (!name) return res.status(400).send('Missing country name');

  const config = COUNTRIES[name];
  if (!config) return res.redirect(302, '/es/');

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.redirect(302, `/${config.htmlFile}`);
  }

  try {
    // --- 1. Build Supabase OR query ---
    // search_text is a STORED generated column: lower(username||name||about||location).
    // A GIN trigram index (idx_search_text_trgm) makes every ilike here an index
    // lookup instead of a full table scan — all terms × all 4 fields, fast.
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const offset = (page - 1) * PAGE_SIZE;
    const expressions = config.terms.map(term => `search_text.ilike.*${term}*`);

    const selectCols = [
      'id', 'username', 'name', 'avatar', 'avatar_c144',
      'isverified', 'subscribeprice', 'favoritedcount', 'subscriberscount',
    ].join(',');

    const params = new URLSearchParams({
      select: selectCols,
      order: 'favoritedcount.desc,subscribeprice.asc',
      limit: String(PAGE_SIZE),
      offset: String(offset),
      or: `(${expressions.join(',')})`,
    });

    const abortCtrl = new AbortController();
    const abortTimer = setTimeout(() => abortCtrl.abort(), 3000);
    let supaFetch;
    try {
      supaFetch = await fetch(`${SUPABASE_URL}/rest/v1/onlyfans_profiles?${params}`, {
        signal: abortCtrl.signal,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Accept-Profile': 'public',
          Prefer: 'count=estimated',
        },
      });
    } finally {
      clearTimeout(abortTimer);
    }

    let creators, totalCount;
    if (supaFetch.status === 416) {
      creators = [];
      totalCount = 0;
    } else {
      if (!supaFetch.ok) throw new Error(`Supabase ${supaFetch.status}`);
      creators = await supaFetch.json();
      const contentRange = supaFetch.headers.get('content-range') || '';
      totalCount = parseInt(contentRange.split('/')[1] || '0', 10) || creators.length;
    }

    // --- 2. Read ES template ---
    const htmlPath = join(ROOT, config.htmlFile);
    let html = readFileSync(htmlPath, 'utf8');

    const canonicalUrl = page > 1
      ? `${BASE_URL}/es/country/${name}/${page}/`
      : `${BASE_URL}/es/country/${name}/`;
    const enUrl = page > 1
      ? `${BASE_URL}/country/${name}/${page}/`
      : `${BASE_URL}/country/${name}/`;

    // hreflang cross-links
    const hreflangLinks = [
      `<link rel="alternate" hreflang="en" href="${enUrl}">`,
      `<link rel="alternate" hreflang="es" href="${canonicalUrl}">`,
      `<link rel="alternate" hreflang="x-default" href="${enUrl}">`,
    ].join('\n');

    const prevLink = page > 2
      ? `<link rel="prev" href="${BASE_URL}/es/country/${name}/${page - 1}/">`
      : page === 2
        ? `<link rel="prev" href="${BASE_URL}/es/country/${name}/">`
        : '';
    const nextLink = creators.length === PAGE_SIZE
      ? `<link rel="next" href="${BASE_URL}/es/country/${name}/${page + 1}/">`
      : '';

    // --- 3. Inject canonical + title ---
    if (/<link[^>]+rel="canonical"/.test(html)) {
      html = html.replace(
        /(<link[^>]+rel="canonical"[^>]+href=")[^"]*(")/,
        `$1${canonicalUrl}$2`
      );
    } else {
      html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}">\n</head>`);
    }

    // Spanish title with page suffix
    const titleSuffix = page > 1 ? ` - Página ${page}` : '';
    html = html.replace(
      /<title>([^<]*)<\/title>/,
      `<title>${escHtml(config.titleEs.replace(` (${YEAR})`, `${titleSuffix} (${YEAR})`))}</title>`
    );

    // Update meta description on first page only (template already has Spanish text)
    if (page === 1 && /<meta name="description"/.test(html)) {
      html = html.replace(
        /(<meta name="description" content=")[^"]*(")/,
        `$1${config.metaDesc}$2`
      );
    }

    // --- 4. Inject JSON-LD + SSR flag + hreflang + pagination ---
    const jsonLd = buildJsonLd(name, config.label, creators, canonicalUrl);
    const ssrFlag = `<script>window.__COUNTRY_SSR={name:${JSON.stringify(name)},count:${totalCount},hasMore:${creators.length === PAGE_SIZE},page:${page}};</script>`;
    const paginationLinks = [prevLink, nextLink].filter(Boolean).join('\n');
    // LCP preload
    const _lcpImg = creators[0]?.avatar || creators[0]?.avatar_c144 || '';
    const _lcpSrc = _lcpImg.startsWith('http') ? _lcpImg : '';
    const preloadLink = _lcpSrc
      ? (() => { const { src, srcset, sizes } = buildResponsiveSources(_lcpSrc); return `<link rel="preload" as="image" fetchpriority="high" href="${src}" imagesrcset="${srcset}" imagesizes="${sizes}">`; })()
      : '';
    html = html.replace(
      '</head>',
      `${preloadLink ? preloadLink + '\n' : ''}${jsonLd}\n${ssrFlag}\n${hreflangLinks}\n${paginationLinks ? paginationLinks + '\n' : ''}</head>`
    );

    // --- 5. Pre-rendered creator cards ---
    const cardsHtml = Array.isArray(creators) && creators.length > 0
      ? creators.map((c, i) => renderCard(c, i)).join('\n')
      : `<p class="text-muted text-center w-100 py-4">No se encontraron creadoras de <strong>${escHtml(config.label)}</strong>.</p>`;

    html = html.replace(
      '<div class="row" id="results"></div>',
      `<div class="row" id="results">\n${cardsHtml}\n</div>`
    );

    // --- 6. Send ---
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/es-country] error:', err.message);
    return res.redirect(302, `/${config.htmlFile}`);
  }
}

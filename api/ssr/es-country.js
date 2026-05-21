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
import { countrySeoEs } from './seo-meta.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const BASE_URL = 'https://fanspedia.net';
const PAGE_SIZE = 24;
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
  const decoding = index === 0 ? 'sync' : 'async';
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
        decoding="${decoding}" referrerpolicy="no-referrer"
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
// Bloque SEO desplegable — inyectado sobre el grid de resultados en cada país
// ---------------------------------------------------------------------------
const SEO_INLINE_CSS = `<style id="seoInlineCSS">
.seo-inline-block{max-width:900px;margin:16px auto;background:var(--bg-secondary,#fff);border:1px solid rgba(0,175,240,0.2);border-left:3px solid #00AFF0;border-radius:10px;overflow:hidden}
.seo-toggle-header{width:100%;background:none;border:none;padding:13px 18px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background .2s;text-align:left}
.seo-toggle-header:hover{background:rgba(0,175,240,0.07)}
.seo-header-label{display:flex;align-items:center;gap:8px;color:#00AFF0;font-size:14px;font-weight:600}
.seo-info-icon{font-size:15px;opacity:.85}
.seo-caret{color:#00AFF0;font-size:11px;transition:transform .3s;flex-shrink:0}
.seo-toggle-header[aria-expanded="true"] .seo-caret{transform:rotate(180deg)}
.seo-inline-content{max-height:0;overflow:hidden;transition:max-height 0.4s ease}
.seo-inline-content.seo-open{max-height:900px}
.seo-inline-content p{color:var(--text-primary,#1a1a1a);font-size:15px;line-height:1.75;padding:0 18px;margin:0 0 14px}
.seo-inline-content p:first-child{padding-top:4px}
</style>`;

function buildEsCountrySeoSection(slug, label) {
  const year = new Date().getFullYear();

  const intros = {
    'united-states':      `Las creadoras de OnlyFans de Estados Unidos dominan los rankings de mayores ingresos de la plataforma y representan el segmento de creadoras de un solo país más grande en ${year}. La economía creativa de EE.UU. se beneficia de infraestructura de pago madura, mercados de equipos de producción profesional y una base de suscriptores doméstica con presupuestos de suscripción por encima del promedio.`,
    'canada':             `Las creadoras canadienses de OnlyFans han construido una sólida reputación en la plataforma por su participación amigable, opciones de contenido bilingüe y frecuencia de publicación por encima del promedio. Estas cualidades se traducen directamente en menor abandono de suscriptores y relaciones de fans a largo plazo que superan la media global de la plataforma.`,
    'united-kingdom':     `Las creadoras de OnlyFans del Reino Unido han posicionado a Gran Bretaña como la tercera nación creadora más grande de la plataforma, con acentos regionales distintivos, sensibilidades de moda y un ingenio característico que resuena con audiencias angloparlantes de todo el mundo.`,
    'australia':          `Las creadoras de OnlyFans de Australia aportan cultura de playa, estética de estilo de vida al aire libre y una confianza relajada que da a los perfiles australianos un aspecto inmediatamente reconocible. La comunidad creadora australiana es colaborativa y activa en múltiples plataformas, lo que produce creadoras con seguidores por encima del promedio.`,
    'argentina':          `Las creadoras de OnlyFans argentinas aportan la sofisticación europea de Buenos Aires, la pasión de la cultura del tango y la expresividad sudamericana a perfiles que atraen constantemente audiencias internacionales mucho más allá del mundo hispanohablante.`,
    'philippines':        `Las creadoras filipinas de OnlyFans han construido una de las comunidades de creadoras más activas del Sudeste Asiático en la plataforma, impulsadas por el inglés como lengua común, una fuerte cultura de redes sociales y un estilo de contenido cálido y centrado en el suscriptor.`,
    'india':              `Las creadoras de OnlyFans de India representan uno de los segmentos internacionales de mayor crecimiento en la plataforma en ${year}, reflejando tanto la expansión de la economía de contenido digital de India como una gran audiencia de la diáspora global que busca activamente representación sudasiática en contenido premium.`,
    'japan':              `Las creadoras de OnlyFans de Japón han cultivado algunos de los perfiles más distintivos de la plataforma, combinando estética J-idol, cultura de moda kawaii y sensibilidades de producción meticulosas que impulsan precios de suscripción premium y retención a largo plazo excepcional.`,
    'brazil':             `Las creadoras de OnlyFans de Brasil han convertido las credenciales estéticas internacionalmente reconocidas del país — cultura de carnaval, estilo de vida playero, expresividad natural — en algunos de los perfiles de mayor participación de la plataforma. Las creadoras brasileñas están entre los perfiles internacionales más buscados en toda la plataforma.`,
    'colombia':           `Las creadoras de OnlyFans de Colombia representan una de las comunidades latinas más activas de la plataforma, combinando la escena de moda urbana de Bogotá con la calidez costera de Cartagena y Medellín y una franqueza natural en la comunicación con fans que los suscriptores de América del Norte y Europa destacan constantemente.`,
    'mexico':             `Las creadoras de OnlyFans de México combinan rica herencia cultural, estéticas costeras de Cancún y Puerto Vallarta y una escena creativa urbana centrada en Ciudad de México para producir una comunidad de creadoras con un alcance notable. México es el mercado de creadoras más grande de América Latina en OnlyFans.`,
    'germany':            `Las creadoras de OnlyFans de Alemania combinan sofisticación europea, estilos de comunicación directos y altos estándares de producción que las comunidades de suscriptores califican constantemente por su transparencia y calidad de contenido.`,
    'france':             `Las creadoras de OnlyFans de Francia aprovechan las estéticas de la dolce vie, una de las tradiciones de moda culturalmente más resonantes del mundo, y una sensibilidad creativa distintiva que impulsa tarifas de suscripción premium entre audiencias internacionales que buscan contenido europeo refinado.`,
    'spain':              `Las creadoras de OnlyFans de España aportan la expresividad ibérica, la pasión de la cultura flamenca y una calidez mediterránea a perfiles que resuenan tanto con audiencias hispanohablantes de Europa como de América Latina — una de las huellas de audiencia natural más amplias de cualquier mercado de creadoras europeo en la plataforma.`,
    'italy':              `Las creadoras de OnlyFans de Italia aprovechan la dolce vita, los estándares de belleza mediterráneos y siglos de cultura de moda y arte para producir contenido con una sofisticación estética inmediatamente reconocible.`,
    'venezuela':          `Las creadoras de OnlyFans de Venezuela han construido una comunidad próspera en la plataforma, con muchas creadoras operando desde bases internacionales. Las creadoras venezolanas aportan una expresividad apasionada y fuertes prácticas de comunicación con fans que se traducen en retención de suscriptores por encima del promedio globalmente.`,
    'chile':              `Las creadoras de OnlyFans de Chile aportan la estética urbana cosmopolita de Santiago, la energía creativa bohemia de Valparaíso y contenido de estilo de vida inspirado en la Patagonia a perfiles que atraen constantemente seguidores sólidos entre audiencias hispanohablantes de las Américas.`,
    'peru':               `Las creadoras de OnlyFans de Perú combinan la diversidad estética andina y costera con la creciente escena creativa urbana de Lima, produciendo una comunidad de creadoras que ha crecido rápidamente junto a la creciente adopción de pagos digitales del país.`,
    'colombia':           `Las creadoras colombianas de OnlyFans representan una de las comunidades de América Latina más activas en la plataforma, combinando la escena de moda de Bogotá con la calidez de la costa caribe y el Pacífico, generando perfiles con audiencias leales tanto locales como internacionales.`,
    'dominican-republic': `Las creadoras de OnlyFans de República Dominicana aportan energía caribeña, estéticas del merengue y bachata y una vibrante escena creativa en Santo Domingo a perfiles que tienen un rendimiento particularmente fuerte con audiencias de suscriptores latinos en EE.UU. y España.`,
    'puerto-rico':        `Las creadoras de OnlyFans de Puerto Rico fusionan la calidez latina y americana, combinando la cultura del reggaetón, el dominio total del inglés y la energía caribeña que le da a los perfiles de PR acceso simultáneo tanto al mercado de suscriptores doméstico de EE.UU. como a las audiencias de América Latina hispanohablantes.`,
  };

  const defaultIntro = `Las creadoras de OnlyFans de ${label} representan un segmento reconocido internacionalmente de la comunidad de creadoras de la plataforma en ${year}. Los perfiles mostrados arriba han sido clasificados por participación de suscriptores y actividad de fans en lugar de por colocación de pago, reflejando genuinamente las creadoras más seguidas y activas de ${label} disponibles ahora mismo en la plataforma.`;

  const closers = [
    `FansPedia hace que explorar creadoras de OnlyFans de ${label} sea más rápido y enfocado que buscar directamente en la plataforma. Todos los perfiles están clasificados por datos de participación real, actualizados regularmente a medida que las creadoras cambian su precio y frecuencia de publicación. Filtra por precio de suscripción, activa solo-verificadas para limitar los resultados a cuentas confirmadas, o navega libremente y carga páginas adicionales.`,
    `Suscribirse a una creadora de OnlyFans de ${label} es un apoyo financiero directo al negocio de contenido de esa persona. Los perfiles clasificados aquí se han verificado como cuentas reales y activas. Usa los filtros al inicio de la página para reducir por precio de suscripción o estado de verificación, luego haz clic en cualquier perfil para visitar directamente su página de OnlyFans.`,
    `No todas las cuentas de OnlyFans de ${label} son igualmente activas. FansPedia muestra primero a las creadoras más comprometidas, clasificadas por métricas de fans reales, para que puedas identificar inmediatamente quién está publicando contenido nuevo activamente. Carga más resultados para explorar más allá de la primera página de perfiles de ${label}.`,
  ];

  const intro = intros[slug] || defaultIntro;
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const closer = closers[hash % closers.length];

  return `${SEO_INLINE_CSS}<div id="seoBlock" class="seo-inline-block">
  <button id="seoToggleBtn" class="seo-toggle-header" onclick="(function(){var c=document.getElementById('seoContent');var b=document.getElementById('seoToggleBtn');var open=c.classList.toggle('seo-open');c.setAttribute('aria-hidden',String(!open));b.setAttribute('aria-expanded',String(open));})()" aria-expanded="false" aria-controls="seoContent">
    <span class="seo-header-label"><span class="seo-info-icon">&#9432;</span> Sobre creadoras de ${label} OnlyFans</span>
    <span class="seo-caret">&#9660;</span>
  </button>
  <div id="seoContent" class="seo-inline-content" aria-hidden="true">
    <p>${intro}</p>
    <p>${closer}</p>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// In-memory per-country HTML cache — avoids Supabase roundtrip on every CDN
// miss. Key: `${name}:${page}`. TTL: 5 minutes.
// ---------------------------------------------------------------------------
const _esCountryCache = new Map(); // key → { html, expiresAt }
const ES_COUNTRY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    // Country lookups target the dedicated `location` column only — much smaller
    // text than the full search_text (username||name||about||location), so the
    // trigram index lookup is dramatically faster and avoids Postgres' 8s
    // statement_timeout on common short terms (uk, tg, etc.) and high-volume
    // matches (thailand→bio mentions).
    const page = Math.max(1, parseInt(req.query.page || '1', 10));

    // ── Memory cache check ──────────────────────────────────────────────────
    const cacheKey = `${name}:${page}`;
    const cachedEntry = _esCountryCache.get(cacheKey);
    if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
      res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
      return res.status(200).send(cachedEntry.html);
    }
    // ────────────────────────────────────────────────────────────────────────
    const offset = (page - 1) * PAGE_SIZE;
    // Drop terms <3 chars: trigram index requires 3+ chars; shorter terms
    // force a seq scan and timeout (e.g. "uk" matched 9k+ rows in bios).
    const filteredTerms = config.terms.filter(t => t && t.length >= 3);
    const expressions = (filteredTerms.length ? filteredTerms : config.terms)
      .map(term => `location.ilike.*${term}*`);

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
    const abortTimer = setTimeout(() => abortCtrl.abort(), 8000);
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

    // Generate conversion-optimized ES title + meta description (rotated by slug hash)
    const { title: seoTitle, description: seoDesc } = countrySeoEs(name, config.label);
    const finalTitle = page > 1 ? `${seoTitle} - Página ${page}` : seoTitle;
    const finalDesc = page > 1 ? `${seoDesc} Página ${page}.` : seoDesc;
    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${escHtml(finalTitle)}</title>`
    );
    if (/<meta name="description"/.test(html)) {
      html = html.replace(
        /(<meta name="description" content=")[^"]*(")/,
        `$1${escHtml(finalDesc)}$2`
      );
    } else {
      html = html.replace('</head>', `  <meta name="description" content="${escHtml(finalDesc)}">\n</head>`);
    }
    // Open Graph + Twitter (idempotent)
    const ogTags = `<meta property="og:title" content="${escHtml(finalTitle)}">
<meta property="og:description" content="${escHtml(finalDesc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(finalTitle)}">
<meta name="twitter:description" content="${escHtml(finalDesc)}">`;
    html = html.replace(/\s*<meta\s+(?:property|name)="(?:og:[^"]+|twitter:[^"]+)"[^>]*>/g, '');
    html = html.replace('</head>', `${ogTags}\n</head>`);

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
    // Inject preload early in <head> — browser discovers LCP image before scripts/styles
    if (preloadLink) {
      html = html.replace(/<meta name="viewport"[^>]*>/, m => `${m}\n  ${preloadLink}`);
    }
    html = html.replace(
      '</head>',
      `${jsonLd}\n${ssrFlag}\n${hreflangLinks}\n${paginationLinks ? paginationLinks + '\n' : ''}</head>`
    );

    // --- 5. Pre-rendered creator cards ---
    const cardsHtml = Array.isArray(creators) && creators.length > 0
      ? creators.map((c, i) => renderCard(c, i)).join('\n')
      : `<p class="text-muted text-center w-100 py-4">No se encontraron creadoras de <strong>${escHtml(config.label)}</strong>.</p>`;

    html = html.replace(
      '<div class="row" id="results"></div>',
      `<div class="row" id="results">\n${cardsHtml}\n</div>`
    );

    // --- 5b. Bloque SEO desplegable sobre el grid de resultados ---
    html = html.replace(
      /<div class="row" id="results">/,
      `${buildEsCountrySeoSection(name, config.label)}\n<div class="row" id="results">`
    );

    // Store in memory cache so warm instances skip Supabase next request
    _esCountryCache.set(cacheKey, { html, expiresAt: Date.now() + ES_COUNTRY_CACHE_TTL });

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

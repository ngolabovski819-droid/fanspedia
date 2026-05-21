/**
 * SSR handler for /country/:name pages
 *
 * Fetches top creators for a given country and returns a fully rendered HTML
 * page so Googlebot sees real content on the first request — matching the
 * structural SEO advantage of Next.js / SSR frameworks.
 *
 * Flow:
 *   1. Resolve slug (e.g. "united-states") → config (terms, label, html file)
 *   2. Fetch top PAGE_SIZE creators from Supabase (OR across all fields)
 *   3. Read the country HTML as a string template
 *   4. Inject JSON-LD (BreadcrumbList + ItemList), pre-rendered cards,
 *      and window.__COUNTRY_SSR so client JS skips the duplicate first fetch
 *   5. Return complete HTML with 5-minute CDN cache
 *
 * On any error the handler falls back to a 302 to the plain HTML page for
 * transparent client-side rendering.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { countrySeoEn } from './seo-meta.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const BASE_URL = 'https://fanspedia.net';
const PAGE_SIZE = 24;
const YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Country config map
// slug → { terms, label, htmlFile, h1, metaDesc }
// ---------------------------------------------------------------------------
const COUNTRIES = {
  'united-states': {
    terms: ['united states', 'usa', 'america', 'american'],
    label: 'United States',
    htmlFile: 'united-states.html',
    h1: 'The Best Onlyfans Creators All Across United States',
    metaDesc: 'Discover the most popular OnlyFans creators across United States. Browse verified profiles, free accounts, and exclusive content from American creators.',
  },
  canada: {
    terms: ['canada', 'canadian'],
    label: 'Canada',
    htmlFile: 'canada.html',
    h1: 'The Best Onlyfans Creators All Across Canada',
    metaDesc: 'Discover the most popular OnlyFans creators across Canada. Browse verified profiles, free accounts, and exclusive content from Canadian creators.',
  },
  argentina: {
    terms: ['argentina', 'argentinian', 'argentine', 'buenos aires'],
    label: 'Argentina',
    htmlFile: 'argentina.html',
    h1: 'The Best OnlyFans Creators From Argentina',
    metaDesc: 'Discover the most popular OnlyFans creators from Argentina. Browse verified profiles, free accounts, and exclusive content from Argentine creators.',
  },
  'united-kingdom': {
    terms: ['united kingdom', 'uk', 'british', 'england', 'english', 'wales', 'welsh', 'scotland', 'scottish'],
    label: 'United Kingdom',
    htmlFile: 'united-kingdom.html',
    h1: 'The Best OnlyFans Creators From the United Kingdom',
    metaDesc: 'Discover the most popular OnlyFans creators from the United Kingdom. Browse verified profiles, free accounts, and exclusive content from British creators.',
  },
  philippines: {
    terms: ['philippines', 'philippine', 'filipina', 'filipinas'],
    label: 'Philippines',
    htmlFile: 'philippines.html',
    h1: 'The Best Onlyfans Creators All Across Philippines',
    metaDesc: 'Discover the most popular OnlyFans creators across Philippines. Browse verified profiles, free accounts, and exclusive content from Philippine creators.',
  },
  india: {
    terms: ['india', 'indian'],
    label: 'India',
    htmlFile: 'india.html',
    h1: 'The Best Onlyfans Creators All Across India',
    metaDesc: 'Discover the most popular OnlyFans creators across India. Browse verified profiles, free accounts, and exclusive content from Indian creators.',
  },
  japan: {
    terms: ['japan', 'japanese'],
    label: 'Japan',
    htmlFile: 'japan.html',
    h1: 'The Best Onlyfans Creators All Across Japan',
    metaDesc: 'Discover the most popular OnlyFans creators across Japan. Browse verified profiles, free accounts, and exclusive content from Japanese creators.',
  },
  'armenia': {
    terms: ["armenia","armenian","yerevan"],
    label: 'Armenia',
    htmlFile: 'armenia.html',
    h1: 'The Best OnlyFans Creators From Armenia',
    metaDesc: 'Discover the most popular OnlyFans creators from Armenia. Browse verified profiles, free accounts, and exclusive content from Armenian creators.',
  },
  'australia': {
    terms: ["australia","australian","sydney","melbourne","brisbane"],
    label: 'Australia',
    htmlFile: 'australia.html',
    h1: 'The Best OnlyFans Creators From Australia',
    metaDesc: 'Discover the most popular OnlyFans creators from Australia. Browse verified profiles, free accounts, and exclusive content from Australian creators.',
  },
  'austria': {
    terms: ["austria","austrian","vienna","wien"],
    label: 'Austria',
    htmlFile: 'austria.html',
    h1: 'The Best OnlyFans Creators From Austria',
    metaDesc: 'Discover the most popular OnlyFans creators from Austria. Browse verified profiles, free accounts, and exclusive content from Austrian creators.',
  },
  'bahamas': {
    terms: ["bahamas","bahamian","nassau"],
    label: 'Bahamas',
    htmlFile: 'bahamas.html',
    h1: 'The Best OnlyFans Creators From Bahamas',
    metaDesc: 'Discover the most popular OnlyFans creators from Bahamas. Browse verified profiles, free accounts, and exclusive content from Bahamian creators.',
  },
  'barbados': {
    terms: ["barbados","barbadian","bridgetown"],
    label: 'Barbados',
    htmlFile: 'barbados.html',
    h1: 'The Best OnlyFans Creators From Barbados',
    metaDesc: 'Discover the most popular OnlyFans creators from Barbados. Browse verified profiles, free accounts, and exclusive content from Barbadian creators.',
  },
  'belarus': {
    terms: ["belarus","belarusian","minsk"],
    label: 'Belarus',
    htmlFile: 'belarus.html',
    h1: 'The Best OnlyFans Creators From Belarus',
    metaDesc: 'Discover the most popular OnlyFans creators from Belarus. Browse verified profiles, free accounts, and exclusive content from Belarusian creators.',
  },
  'belgium': {
    terms: ["belgium","belgian","brussels"],
    label: 'Belgium',
    htmlFile: 'belgium.html',
    h1: 'The Best OnlyFans Creators From Belgium',
    metaDesc: 'Discover the most popular OnlyFans creators from Belgium. Browse verified profiles, free accounts, and exclusive content from Belgian creators.',
  },
  'bolivia': {
    terms: ["bolivia","bolivian","la paz","santa cruz"],
    label: 'Bolivia',
    htmlFile: 'bolivia.html',
    h1: 'The Best OnlyFans Creators From Bolivia',
    metaDesc: 'Discover the most popular OnlyFans creators from Bolivia. Browse verified profiles, free accounts, and exclusive content from Bolivian creators.',
  },
  'bosnia-and-herzegovina': {
    terms: ["bosnia","bosnian","herzegovina","sarajevo"],
    label: 'Bosnia and Herzegovina',
    htmlFile: 'bosnia-and-herzegovina.html',
    h1: 'The Best OnlyFans Creators From Bosnia and Herzegovina',
    metaDesc: 'Discover the most popular OnlyFans creators from Bosnia and Herzegovina. Browse verified profiles, free accounts, and exclusive content from Bosnian creators.',
  },
  'brazil': {
    terms: ["brazil","brazilian","brasil","rio de janeiro","sao paulo"],
    label: 'Brazil',
    htmlFile: 'brazil.html',
    h1: 'The Best OnlyFans Creators From Brazil',
    metaDesc: 'Discover the most popular OnlyFans creators from Brazil. Browse verified profiles, free accounts, and exclusive content from Brazilian creators.',
  },
  'bulgaria': {
    terms: ["bulgaria","bulgarian","sofia"],
    label: 'Bulgaria',
    htmlFile: 'bulgaria.html',
    h1: 'The Best OnlyFans Creators From Bulgaria',
    metaDesc: 'Discover the most popular OnlyFans creators from Bulgaria. Browse verified profiles, free accounts, and exclusive content from Bulgarian creators.',
  },
  'cambodia': {
    terms: ["cambodia","cambodian","phnom penh"],
    label: 'Cambodia',
    htmlFile: 'cambodia.html',
    h1: 'The Best OnlyFans Creators From Cambodia',
    metaDesc: 'Discover the most popular OnlyFans creators from Cambodia. Browse verified profiles, free accounts, and exclusive content from Cambodian creators.',
  },
  'chile': {
    terms: ["chile","chilean","santiago","chilena"],
    label: 'Chile',
    htmlFile: 'chile.html',
    h1: 'The Best OnlyFans Creators From Chile',
    metaDesc: 'Discover the most popular OnlyFans creators from Chile. Browse verified profiles, free accounts, and exclusive content from Chilean creators.',
  },
  'china': {
    terms: ["china","chinese","beijing","shanghai"],
    label: 'China',
    htmlFile: 'china.html',
    h1: 'The Best OnlyFans Creators From China',
    metaDesc: 'Discover the most popular OnlyFans creators from China. Browse verified profiles, free accounts, and exclusive content from Chinese creators.',
  },
  'colombia': {
    terms: ["colombia","colombian","bogota","medellin","colombiana"],
    label: 'Colombia',
    htmlFile: 'colombia.html',
    h1: 'The Best OnlyFans Creators From Colombia',
    metaDesc: 'Discover the most popular OnlyFans creators from Colombia. Browse verified profiles, free accounts, and exclusive content from Colombian creators.',
  },
  'costa-rica': {
    terms: ["costa rica","costa rican","san jose","tica"],
    label: 'Costa Rica',
    htmlFile: 'costa-rica.html',
    h1: 'The Best OnlyFans Creators From Costa Rica',
    metaDesc: 'Discover the most popular OnlyFans creators from Costa Rica. Browse verified profiles, free accounts, and exclusive content from Costa Rican creators.',
  },
  'croatia': {
    terms: ["croatia","croatian","zagreb"],
    label: 'Croatia',
    htmlFile: 'croatia.html',
    h1: 'The Best OnlyFans Creators From Croatia',
    metaDesc: 'Discover the most popular OnlyFans creators from Croatia. Browse verified profiles, free accounts, and exclusive content from Croatian creators.',
  },
  'cuba': {
    terms: ["cuba","cuban","havana","cubana"],
    label: 'Cuba',
    htmlFile: 'cuba.html',
    h1: 'The Best OnlyFans Creators From Cuba',
    metaDesc: 'Discover the most popular OnlyFans creators from Cuba. Browse verified profiles, free accounts, and exclusive content from Cuban creators.',
  },
  'cyprus': {
    terms: ["cyprus","cypriot","nicosia"],
    label: 'Cyprus',
    htmlFile: 'cyprus.html',
    h1: 'The Best OnlyFans Creators From Cyprus',
    metaDesc: 'Discover the most popular OnlyFans creators from Cyprus. Browse verified profiles, free accounts, and exclusive content from Cypriot creators.',
  },
  'czech-republic': {
    terms: ["czech","czech republic","czechia","prague"],
    label: 'Czech Republic',
    htmlFile: 'czech-republic.html',
    h1: 'The Best OnlyFans Creators From Czech Republic',
    metaDesc: 'Discover the most popular OnlyFans creators from Czech Republic. Browse verified profiles, free accounts, and exclusive content from Czech creators.',
  },
  'denmark': {
    terms: ["denmark","danish","copenhagen"],
    label: 'Denmark',
    htmlFile: 'denmark.html',
    h1: 'The Best OnlyFans Creators From Denmark',
    metaDesc: 'Discover the most popular OnlyFans creators from Denmark. Browse verified profiles, free accounts, and exclusive content from Danish creators.',
  },
  'dominican-republic': {
    terms: ["dominican","dominican republic","santo domingo","dominicana"],
    label: 'Dominican Republic',
    htmlFile: 'dominican-republic.html',
    h1: 'The Best OnlyFans Creators From Dominican Republic',
    metaDesc: 'Discover the most popular OnlyFans creators from Dominican Republic. Browse verified profiles, free accounts, and exclusive content from Dominican creators.',
  },
  'ecuador': {
    terms: ["ecuador","ecuadorian","quito","guayaquil","ecuatoriana"],
    label: 'Ecuador',
    htmlFile: 'ecuador.html',
    h1: 'The Best OnlyFans Creators From Ecuador',
    metaDesc: 'Discover the most popular OnlyFans creators from Ecuador. Browse verified profiles, free accounts, and exclusive content from Ecuadorian creators.',
  },
  'egypt': {
    terms: ["egypt","egyptian","cairo","alexandria"],
    label: 'Egypt',
    htmlFile: 'egypt.html',
    h1: 'The Best OnlyFans Creators From Egypt',
    metaDesc: 'Discover the most popular OnlyFans creators from Egypt. Browse verified profiles, free accounts, and exclusive content from Egyptian creators.',
  },
  'el-salvador': {
    terms: ["el salvador","salvadoran","san salvador"],
    label: 'El Salvador',
    htmlFile: 'el-salvador.html',
    h1: 'The Best OnlyFans Creators From El Salvador',
    metaDesc: 'Discover the most popular OnlyFans creators from El Salvador. Browse verified profiles, free accounts, and exclusive content from Salvadoran creators.',
  },
  'estonia': {
    terms: ["estonia","estonian","tallinn"],
    label: 'Estonia',
    htmlFile: 'estonia.html',
    h1: 'The Best OnlyFans Creators From Estonia',
    metaDesc: 'Discover the most popular OnlyFans creators from Estonia. Browse verified profiles, free accounts, and exclusive content from Estonian creators.',
  },
  'finland': {
    terms: ["finland","finnish","helsinki"],
    label: 'Finland',
    htmlFile: 'finland.html',
    h1: 'The Best OnlyFans Creators From Finland',
    metaDesc: 'Discover the most popular OnlyFans creators from Finland. Browse verified profiles, free accounts, and exclusive content from Finnish creators.',
  },
  'france': {
    terms: ["france","french","paris","française"],
    label: 'France',
    htmlFile: 'france.html',
    h1: 'The Best OnlyFans Creators From France',
    metaDesc: 'Discover the most popular OnlyFans creators from France. Browse verified profiles, free accounts, and exclusive content from French creators.',
  },
  'georgia': {
    terms: ["georgia country","georgian","tbilisi"],
    label: 'Georgia',
    htmlFile: 'georgia.html',
    h1: 'The Best OnlyFans Creators From Georgia',
    metaDesc: 'Discover the most popular OnlyFans creators from Georgia. Browse verified profiles, free accounts, and exclusive content from Georgian creators.',
  },
  'germany': {
    terms: ["germany","german","berlin","deutschland"],
    label: 'Germany',
    htmlFile: 'germany.html',
    h1: 'The Best OnlyFans Creators From Germany',
    metaDesc: 'Discover the most popular OnlyFans creators from Germany. Browse verified profiles, free accounts, and exclusive content from German creators.',
  },
  'ghana': {
    terms: ["ghana","ghanaian","accra"],
    label: 'Ghana',
    htmlFile: 'ghana.html',
    h1: 'The Best OnlyFans Creators From Ghana',
    metaDesc: 'Discover the most popular OnlyFans creators from Ghana. Browse verified profiles, free accounts, and exclusive content from Ghanaian creators.',
  },
  'greece': {
    terms: ["greece","greek","athens","hellenic"],
    label: 'Greece',
    htmlFile: 'greece.html',
    h1: 'The Best OnlyFans Creators From Greece',
    metaDesc: 'Discover the most popular OnlyFans creators from Greece. Browse verified profiles, free accounts, and exclusive content from Greek creators.',
  },
  'guam': {
    terms: ["guam","guamanian","chamorro"],
    label: 'Guam',
    htmlFile: 'guam.html',
    h1: 'The Best OnlyFans Creators From Guam',
    metaDesc: 'Discover the most popular OnlyFans creators from Guam. Browse verified profiles, free accounts, and exclusive content from Guamanian creators.',
  },
  'guatemala': {
    terms: ["guatemala","guatemalan","guatemalteca"],
    label: 'Guatemala',
    htmlFile: 'guatemala.html',
    h1: 'The Best OnlyFans Creators From Guatemala',
    metaDesc: 'Discover the most popular OnlyFans creators from Guatemala. Browse verified profiles, free accounts, and exclusive content from Guatemalan creators.',
  },
  'honduras': {
    terms: ["honduras","honduran","tegucigalpa","hondureña"],
    label: 'Honduras',
    htmlFile: 'honduras.html',
    h1: 'The Best OnlyFans Creators From Honduras',
    metaDesc: 'Discover the most popular OnlyFans creators from Honduras. Browse verified profiles, free accounts, and exclusive content from Honduran creators.',
  },
  'hong-kong': {
    terms: ["hong kong","hongkong","hk"],
    label: 'Hong Kong',
    htmlFile: 'hong-kong.html',
    h1: 'The Best OnlyFans Creators From Hong Kong',
    metaDesc: 'Discover the most popular OnlyFans creators from Hong Kong. Browse verified profiles, free accounts, and exclusive content from Hong Kong creators.',
  },
  'hungary': {
    terms: ["hungary","hungarian","budapest"],
    label: 'Hungary',
    htmlFile: 'hungary.html',
    h1: 'The Best OnlyFans Creators From Hungary',
    metaDesc: 'Discover the most popular OnlyFans creators from Hungary. Browse verified profiles, free accounts, and exclusive content from Hungarian creators.',
  },
  'iceland': {
    terms: ["iceland","icelandic","reykjavik"],
    label: 'Iceland',
    htmlFile: 'iceland.html',
    h1: 'The Best OnlyFans Creators From Iceland',
    metaDesc: 'Discover the most popular OnlyFans creators from Iceland. Browse verified profiles, free accounts, and exclusive content from Icelandic creators.',
  },
  'indonesia': {
    terms: ["indonesia","indonesian","jakarta","bali"],
    label: 'Indonesia',
    htmlFile: 'indonesia.html',
    h1: 'The Best OnlyFans Creators From Indonesia',
    metaDesc: 'Discover the most popular OnlyFans creators from Indonesia. Browse verified profiles, free accounts, and exclusive content from Indonesian creators.',
  },
  'ireland': {
    terms: ["ireland","irish","dublin"],
    label: 'Ireland',
    htmlFile: 'ireland.html',
    h1: 'The Best OnlyFans Creators From Ireland',
    metaDesc: 'Discover the most popular OnlyFans creators from Ireland. Browse verified profiles, free accounts, and exclusive content from Irish creators.',
  },
  'israel': {
    terms: ["israel","israeli","tel aviv","jerusalem"],
    label: 'Israel',
    htmlFile: 'israel.html',
    h1: 'The Best OnlyFans Creators From Israel',
    metaDesc: 'Discover the most popular OnlyFans creators from Israel. Browse verified profiles, free accounts, and exclusive content from Israeli creators.',
  },
  'italy': {
    terms: ["italy","italian","rome","milan","italia","italiana"],
    label: 'Italy',
    htmlFile: 'italy.html',
    h1: 'The Best OnlyFans Creators From Italy',
    metaDesc: 'Discover the most popular OnlyFans creators from Italy. Browse verified profiles, free accounts, and exclusive content from Italian creators.',
  },
  'jamaica': {
    terms: ["jamaica","jamaican","kingston"],
    label: 'Jamaica',
    htmlFile: 'jamaica.html',
    h1: 'The Best OnlyFans Creators From Jamaica',
    metaDesc: 'Discover the most popular OnlyFans creators from Jamaica. Browse verified profiles, free accounts, and exclusive content from Jamaican creators.',
  },
  'kenya': {
    terms: ["kenya","kenyan","nairobi"],
    label: 'Kenya',
    htmlFile: 'kenya.html',
    h1: 'The Best OnlyFans Creators From Kenya',
    metaDesc: 'Discover the most popular OnlyFans creators from Kenya. Browse verified profiles, free accounts, and exclusive content from Kenyan creators.',
  },
  'latvia': {
    terms: ["latvia","latvian","riga"],
    label: 'Latvia',
    htmlFile: 'latvia.html',
    h1: 'The Best OnlyFans Creators From Latvia',
    metaDesc: 'Discover the most popular OnlyFans creators from Latvia. Browse verified profiles, free accounts, and exclusive content from Latvian creators.',
  },
  'lebanon': {
    terms: ["lebanon","lebanese","beirut"],
    label: 'Lebanon',
    htmlFile: 'lebanon.html',
    h1: 'The Best OnlyFans Creators From Lebanon',
    metaDesc: 'Discover the most popular OnlyFans creators from Lebanon. Browse verified profiles, free accounts, and exclusive content from Lebanese creators.',
  },
  'lithuania': {
    terms: ["lithuania","lithuanian","vilnius"],
    label: 'Lithuania',
    htmlFile: 'lithuania.html',
    h1: 'The Best OnlyFans Creators From Lithuania',
    metaDesc: 'Discover the most popular OnlyFans creators from Lithuania. Browse verified profiles, free accounts, and exclusive content from Lithuanian creators.',
  },
  'luxembourg': {
    terms: ["luxembourg","luxembourgish"],
    label: 'Luxembourg',
    htmlFile: 'luxembourg.html',
    h1: 'The Best OnlyFans Creators From Luxembourg',
    metaDesc: 'Discover the most popular OnlyFans creators from Luxembourg. Browse verified profiles, free accounts, and exclusive content from Luxembourgish creators.',
  },
  'malaysia': {
    terms: ["malaysia","malaysian","kuala lumpur"],
    label: 'Malaysia',
    htmlFile: 'malaysia.html',
    h1: 'The Best OnlyFans Creators From Malaysia',
    metaDesc: 'Discover the most popular OnlyFans creators from Malaysia. Browse verified profiles, free accounts, and exclusive content from Malaysian creators.',
  },
  'malta': {
    terms: ["malta","maltese","valletta"],
    label: 'Malta',
    htmlFile: 'malta.html',
    h1: 'The Best OnlyFans Creators From Malta',
    metaDesc: 'Discover the most popular OnlyFans creators from Malta. Browse verified profiles, free accounts, and exclusive content from Maltese creators.',
  },
  'mexico': {
    terms: ["mexico","mexican","mexico city","guadalajara","mexicana"],
    label: 'Mexico',
    htmlFile: 'mexico.html',
    h1: 'The Best OnlyFans Creators From Mexico',
    metaDesc: 'Discover the most popular OnlyFans creators from Mexico. Browse verified profiles, free accounts, and exclusive content from Mexican creators.',
  },
  'moldova': {
    terms: ["moldova","moldovan","chisinau"],
    label: 'Moldova',
    htmlFile: 'moldova.html',
    h1: 'The Best OnlyFans Creators From Moldova',
    metaDesc: 'Discover the most popular OnlyFans creators from Moldova. Browse verified profiles, free accounts, and exclusive content from Moldovan creators.',
  },
  'monaco': {
    terms: ["monaco","monegasque","monte carlo"],
    label: 'Monaco',
    htmlFile: 'monaco.html',
    h1: 'The Best OnlyFans Creators From Monaco',
    metaDesc: 'Discover the most popular OnlyFans creators from Monaco. Browse verified profiles, free accounts, and exclusive content from Monégasque creators.',
  },
  'montenegro': {
    terms: ["montenegro","montenegrin","podgorica"],
    label: 'Montenegro',
    htmlFile: 'montenegro.html',
    h1: 'The Best OnlyFans Creators From Montenegro',
    metaDesc: 'Discover the most popular OnlyFans creators from Montenegro. Browse verified profiles, free accounts, and exclusive content from Montenegrin creators.',
  },
  'morocco': {
    terms: ["morocco","moroccan","casablanca","marrakech"],
    label: 'Morocco',
    htmlFile: 'morocco.html',
    h1: 'The Best OnlyFans Creators From Morocco',
    metaDesc: 'Discover the most popular OnlyFans creators from Morocco. Browse verified profiles, free accounts, and exclusive content from Moroccan creators.',
  },
  'netherlands': {
    terms: ["netherlands","dutch","holland","amsterdam"],
    label: 'Netherlands',
    htmlFile: 'netherlands.html',
    h1: 'The Best OnlyFans Creators From Netherlands',
    metaDesc: 'Discover the most popular OnlyFans creators from Netherlands. Browse verified profiles, free accounts, and exclusive content from Dutch creators.',
  },
  'new-zealand': {
    terms: ["new zealand","nz","kiwi","auckland","wellington"],
    label: 'New Zealand',
    htmlFile: 'new-zealand.html',
    h1: 'The Best OnlyFans Creators From New Zealand',
    metaDesc: 'Discover the most popular OnlyFans creators from New Zealand. Browse verified profiles, free accounts, and exclusive content from New Zealander creators.',
  },
  'nigeria': {
    terms: ["nigeria","nigerian","lagos","abuja"],
    label: 'Nigeria',
    htmlFile: 'nigeria.html',
    h1: 'The Best OnlyFans Creators From Nigeria',
    metaDesc: 'Discover the most popular OnlyFans creators from Nigeria. Browse verified profiles, free accounts, and exclusive content from Nigerian creators.',
  },
  'norway': {
    terms: ["norway","norwegian","oslo"],
    label: 'Norway',
    htmlFile: 'norway.html',
    h1: 'The Best OnlyFans Creators From Norway',
    metaDesc: 'Discover the most popular OnlyFans creators from Norway. Browse verified profiles, free accounts, and exclusive content from Norwegian creators.',
  },
  'pakistan': {
    terms: ["pakistan","pakistani","karachi","lahore","islamabad"],
    label: 'Pakistan',
    htmlFile: 'pakistan.html',
    h1: 'The Best OnlyFans Creators From Pakistan',
    metaDesc: 'Discover the most popular OnlyFans creators from Pakistan. Browse verified profiles, free accounts, and exclusive content from Pakistani creators.',
  },
  'panama': {
    terms: ["panama","panamanian","panama city","panameña"],
    label: 'Panama',
    htmlFile: 'panama.html',
    h1: 'The Best OnlyFans Creators From Panama',
    metaDesc: 'Discover the most popular OnlyFans creators from Panama. Browse verified profiles, free accounts, and exclusive content from Panamanian creators.',
  },
  'paraguay': {
    terms: ["paraguay","paraguayan","asuncion","paraguaya"],
    label: 'Paraguay',
    htmlFile: 'paraguay.html',
    h1: 'The Best OnlyFans Creators From Paraguay',
    metaDesc: 'Discover the most popular OnlyFans creators from Paraguay. Browse verified profiles, free accounts, and exclusive content from Paraguayan creators.',
  },
  'peru': {
    terms: ["peru","peruvian","lima","peruana"],
    label: 'Peru',
    htmlFile: 'peru.html',
    h1: 'The Best OnlyFans Creators From Peru',
    metaDesc: 'Discover the most popular OnlyFans creators from Peru. Browse verified profiles, free accounts, and exclusive content from Peruvian creators.',
  },
  'poland': {
    terms: ["poland","polish","warsaw","krakow","polska"],
    label: 'Poland',
    htmlFile: 'poland.html',
    h1: 'The Best OnlyFans Creators From Poland',
    metaDesc: 'Discover the most popular OnlyFans creators from Poland. Browse verified profiles, free accounts, and exclusive content from Polish creators.',
  },
  'portugal': {
    terms: ["portugal","portuguese","lisbon","porto","portuguesa"],
    label: 'Portugal',
    htmlFile: 'portugal.html',
    h1: 'The Best OnlyFans Creators From Portugal',
    metaDesc: 'Discover the most popular OnlyFans creators from Portugal. Browse verified profiles, free accounts, and exclusive content from Portuguese creators.',
  },
  'puerto-rico': {
    terms: ["puerto rico","puerto rican","san juan","boricua"],
    label: 'Puerto Rico',
    htmlFile: 'puerto-rico.html',
    h1: 'The Best OnlyFans Creators From Puerto Rico',
    metaDesc: 'Discover the most popular OnlyFans creators from Puerto Rico. Browse verified profiles, free accounts, and exclusive content from Puerto Rican creators.',
  },
  'romania': {
    terms: ["romania","romanian","bucharest"],
    label: 'Romania',
    htmlFile: 'romania.html',
    h1: 'The Best OnlyFans Creators From Romania',
    metaDesc: 'Discover the most popular OnlyFans creators from Romania. Browse verified profiles, free accounts, and exclusive content from Romanian creators.',
  },
  'russia': {
    terms: ["russia","russian","moscow","saint petersburg"],
    label: 'Russia',
    htmlFile: 'russia.html',
    h1: 'The Best OnlyFans Creators From Russia',
    metaDesc: 'Discover the most popular OnlyFans creators from Russia. Browse verified profiles, free accounts, and exclusive content from Russian creators.',
  },
  'saudi-arabia': {
    terms: ["saudi arabia","saudi","riyadh","jeddah"],
    label: 'Saudi Arabia',
    htmlFile: 'saudi-arabia.html',
    h1: 'The Best OnlyFans Creators From Saudi Arabia',
    metaDesc: 'Discover the most popular OnlyFans creators from Saudi Arabia. Browse verified profiles, free accounts, and exclusive content from Saudi creators.',
  },
  'scotland': {
    terms: ["scotland","scottish","edinburgh","glasgow"],
    label: 'Scotland',
    htmlFile: 'scotland.html',
    h1: 'The Best OnlyFans Creators From Scotland',
    metaDesc: 'Discover the most popular OnlyFans creators from Scotland. Browse verified profiles, free accounts, and exclusive content from Scottish creators.',
  },
  'serbia': {
    terms: ["serbia","serbian","belgrade"],
    label: 'Serbia',
    htmlFile: 'serbia.html',
    h1: 'The Best OnlyFans Creators From Serbia',
    metaDesc: 'Discover the most popular OnlyFans creators from Serbia. Browse verified profiles, free accounts, and exclusive content from Serbian creators.',
  },
  'singapore': {
    terms: ["singapore","singaporean"],
    label: 'Singapore',
    htmlFile: 'singapore.html',
    h1: 'The Best OnlyFans Creators From Singapore',
    metaDesc: 'Discover the most popular OnlyFans creators from Singapore. Browse verified profiles, free accounts, and exclusive content from Singaporean creators.',
  },
  'slovakia': {
    terms: ["slovakia","slovak","bratislava"],
    label: 'Slovakia',
    htmlFile: 'slovakia.html',
    h1: 'The Best OnlyFans Creators From Slovakia',
    metaDesc: 'Discover the most popular OnlyFans creators from Slovakia. Browse verified profiles, free accounts, and exclusive content from Slovak creators.',
  },
  'slovenia': {
    terms: ["slovenia","slovenian","ljubljana"],
    label: 'Slovenia',
    htmlFile: 'slovenia.html',
    h1: 'The Best OnlyFans Creators From Slovenia',
    metaDesc: 'Discover the most popular OnlyFans creators from Slovenia. Browse verified profiles, free accounts, and exclusive content from Slovenian creators.',
  },
  'south-africa': {
    terms: ["south africa","south african","cape town","johannesburg"],
    label: 'South Africa',
    htmlFile: 'south-africa.html',
    h1: 'The Best OnlyFans Creators From South Africa',
    metaDesc: 'Discover the most popular OnlyFans creators from South Africa. Browse verified profiles, free accounts, and exclusive content from South African creators.',
  },
  'south-korea': {
    terms: ["south korea","korean","seoul","kpop","k-pop"],
    label: 'South Korea',
    htmlFile: 'south-korea.html',
    h1: 'The Best OnlyFans Creators From South Korea',
    metaDesc: 'Discover the most popular OnlyFans creators from South Korea. Browse verified profiles, free accounts, and exclusive content from Korean creators.',
  },
  'spain': {
    terms: ["spain","spanish","madrid","barcelona","española"],
    label: 'Spain',
    htmlFile: 'spain.html',
    h1: 'The Best OnlyFans Creators From Spain',
    metaDesc: 'Discover the most popular OnlyFans creators from Spain. Browse verified profiles, free accounts, and exclusive content from Spanish creators.',
  },
  'sri-lanka': {
    terms: ["sri lanka","sri lankan","colombo","ceylon"],
    label: 'Sri Lanka',
    htmlFile: 'sri-lanka.html',
    h1: 'The Best OnlyFans Creators From Sri Lanka',
    metaDesc: 'Discover the most popular OnlyFans creators from Sri Lanka. Browse verified profiles, free accounts, and exclusive content from Sri Lankan creators.',
  },
  'sweden': {
    terms: ["sweden","swedish","stockholm"],
    label: 'Sweden',
    htmlFile: 'sweden.html',
    h1: 'The Best OnlyFans Creators From Sweden',
    metaDesc: 'Discover the most popular OnlyFans creators from Sweden. Browse verified profiles, free accounts, and exclusive content from Swedish creators.',
  },
  'switzerland': {
    terms: ["switzerland","swiss","zurich","geneva"],
    label: 'Switzerland',
    htmlFile: 'switzerland.html',
    h1: 'The Best OnlyFans Creators From Switzerland',
    metaDesc: 'Discover the most popular OnlyFans creators from Switzerland. Browse verified profiles, free accounts, and exclusive content from Swiss creators.',
  },
  'taiwan': {
    terms: ["taiwan","taiwanese","taipei"],
    label: 'Taiwan',
    htmlFile: 'taiwan.html',
    h1: 'The Best OnlyFans Creators From Taiwan',
    metaDesc: 'Discover the most popular OnlyFans creators from Taiwan. Browse verified profiles, free accounts, and exclusive content from Taiwanese creators.',
  },
  'thailand': {
    terms: ["thailand","thai","bangkok"],
    label: 'Thailand',
    htmlFile: 'thailand.html',
    h1: 'The Best OnlyFans Creators From Thailand',
    metaDesc: 'Discover the most popular OnlyFans creators from Thailand. Browse verified profiles, free accounts, and exclusive content from Thai creators.',
  },
  'trinidad-and-tobago': {
    terms: ["trinidad","tobago","trinidadian","port of spain"],
    label: 'Trinidad and Tobago',
    htmlFile: 'trinidad-and-tobago.html',
    h1: 'The Best OnlyFans Creators From Trinidad and Tobago',
    metaDesc: 'Discover the most popular OnlyFans creators from Trinidad and Tobago. Browse verified profiles, free accounts, and exclusive content from Trinidadian creators.',
  },
  'tunisia': {
    terms: ["tunisia","tunisian","tunis"],
    label: 'Tunisia',
    htmlFile: 'tunisia.html',
    h1: 'The Best OnlyFans Creators From Tunisia',
    metaDesc: 'Discover the most popular OnlyFans creators from Tunisia. Browse verified profiles, free accounts, and exclusive content from Tunisian creators.',
  },
  'turkey': {
    terms: ["turkey","turkish","istanbul","ankara"],
    label: 'Turkey',
    htmlFile: 'turkey.html',
    h1: 'The Best OnlyFans Creators From Turkey',
    metaDesc: 'Discover the most popular OnlyFans creators from Turkey. Browse verified profiles, free accounts, and exclusive content from Turkish creators.',
  },
  'ukraine': {
    terms: ["ukraine","ukrainian","kyiv","odessa"],
    label: 'Ukraine',
    htmlFile: 'ukraine.html',
    h1: 'The Best OnlyFans Creators From Ukraine',
    metaDesc: 'Discover the most popular OnlyFans creators from Ukraine. Browse verified profiles, free accounts, and exclusive content from Ukrainian creators.',
  },
  'united-arab-emirates': {
    terms: ["uae","emirates","dubai","abu dhabi"],
    label: 'United Arab Emirates',
    htmlFile: 'united-arab-emirates.html',
    h1: 'The Best OnlyFans Creators From United Arab Emirates',
    metaDesc: 'Discover the most popular OnlyFans creators from United Arab Emirates. Browse verified profiles, free accounts, and exclusive content from Emirati creators.',
  },
  'uruguay': {
    terms: ["uruguay","uruguayan","montevideo","uruguaya"],
    label: 'Uruguay',
    htmlFile: 'uruguay.html',
    h1: 'The Best OnlyFans Creators From Uruguay',
    metaDesc: 'Discover the most popular OnlyFans creators from Uruguay. Browse verified profiles, free accounts, and exclusive content from Uruguayan creators.',
  },
  'venezuela': {
    terms: ["venezuela","venezuelan","caracas","venezolana"],
    label: 'Venezuela',
    htmlFile: 'venezuela.html',
    h1: 'The Best OnlyFans Creators From Venezuela',
    metaDesc: 'Discover the most popular OnlyFans creators from Venezuela. Browse verified profiles, free accounts, and exclusive content from Venezuelan creators.',
  },
  'vietnam': {
    terms: ["vietnam","vietnamese","ho chi minh","hanoi"],
    label: 'Vietnam',
    htmlFile: 'vietnam.html',
    h1: 'The Best OnlyFans Creators From Vietnam',
    metaDesc: 'Discover the most popular OnlyFans creators from Vietnam. Browse verified profiles, free accounts, and exclusive content from Vietnamese creators.',
  },
};

// ---------------------------------------------------------------------------
// Image helpers (mirrors client-side buildResponsiveSources)
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
    : 'FREE';
  const isVerified = item.isVerified ?? item.isverified;
  const verifiedBadge = isVerified ? '<span aria-label="Verified" title="Verified creator">✓ </span>' : '';
  const profileUrl = username ? `https://onlyfans.com/${encodeURIComponent(username)}` : '#';
  const loading = index === 0 ? 'eager' : 'lazy';
  const fetchpriority = index === 0 ? ' fetchpriority="high"' : '';
  const decoding = index === 0 ? 'sync' : 'async';
  const priceHtml = priceText === 'FREE'
    ? `<p class="price-free" style="color:#34c759;font-weight:700;font-size:16px;text-transform:uppercase;">FREE</p>`
    : `<p class="price-tag" style="color:#34c759;font-weight:700;font-size:18px;">${priceText}</p>`;

  return `<div class="col-sm-6 col-md-4 col-lg-3 mb-4">
  <div class="card h-100">
    <button class="favorite-btn" data-username="${username}" onclick="event.preventDefault();toggleFavorite('${username}',this);">
      <span>♡</span>
    </button>
    <div class="card-img-wrap">
      <img src="${src}" srcset="${srcset}" sizes="${sizes}"
        alt="${name} OnlyFans creator" loading="${loading}"${fetchpriority}
        decoding="${decoding}" referrerpolicy="no-referrer"
        onerror="if(this.src!=='/static/no-image.png'){this.removeAttribute('srcset');this.removeAttribute('sizes');this.src='${escHtml(imgSrc)}';this.style.opacity='0.4';}">
    </div>
    <div class="card-body">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:4px;">${verifiedBadge}${name}</h3>
      <p class="username">@${username}</p>
      ${priceHtml}
      <a href="${escHtml(profileUrl)}" class="view-profile-btn" target="_blank" rel="noopener noreferrer">View Profile</a>
    </div>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// JSON-LD structured data
// ---------------------------------------------------------------------------
function buildJsonLd(slug, label, creators, canonicalUrl) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Countries', item: `${BASE_URL}/country/` },
      { '@type': 'ListItem', position: 3, name: label, item: canonicalUrl },
    ],
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best ${label} OnlyFans Creators (${YEAR})`,
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
// Collapsible SEO block — injected above results grid on every country page
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

function buildCountrySeoSection(slug, label) {
  const year = new Date().getFullYear();

  const intros = {
    'united-states':       `American OnlyFans creators dominate the platform's top-earning charts and represent the largest single-country creator segment in ${year}. The US creator economy benefits from mature payment infrastructure, professional production equipment markets, and a domestic subscriber base with above-average subscription budgets — a combination that drives competitive earnings per subscriber and high content quality standards across the board.`,
    'canada':              `Canadian OnlyFans creators have built a strong platform reputation for friendly engagement, bilingual content options, and above-average posting frequency — qualities that translate directly into low subscriber churn and long-term fan relationships. The Canadian creator community spans coastal BC, Ontario's urban centres, and Quebec's French-language scene, producing genuine content diversity across a single national page.`,
    'united-kingdom':      `UK OnlyFans creators have positioned Britain as the third-largest creator nation on the platform, with distinctive regional accents, fashion sensibilities, and a dry wit that resonates powerfully with English-speaking audiences worldwide. British creators frequently command premium subscription rates driven by the immediate recognisability of their regional identity and the trust that comes with English-as-first-language communication.`,
    'australia':           `Australian OnlyFans creators bring beach culture, outdoor lifestyle aesthetics, and a relaxed confidence that gives Aussie profiles an instantly recognisable look. The Australian creator community is collaborative and cross-platform active, which tends to produce creators with above-average social followings and strong subscriber conversion from external traffic sources.`,
    'argentina':           `Argentine OnlyFans creators bring Buenos Aires' European-influenced sophistication, tango culture's passion, and South American expressiveness to profiles that consistently attract international audiences far beyond the Spanish-speaking world. Argentine creators are known for strong fan communication and above-average response rates to subscriber messages — a key driver of their high retention metrics.`,
    'philippines':         `Filipino OnlyFans creators have built one of Southeast Asia's most active creator communities on the platform, driven by near-universal English fluency, a strong social media culture, and a warm, subscriber-first content style. Philippines-based creators show some of the highest direct fan message engagement rates in the region — a quality that drives subscription renewals far above regional benchmarks.`,
    'india':               `Indian OnlyFans creators represent one of the fastest-growing international segments on the platform in ${year}, reflecting both India's expanding digital economy and a large global diaspora audience actively seeking South Asian representation. The creator community spans diverse regional aesthetics — from North Indian to South Indian to diaspora creators in the UK, US, and Canada.`,
    'japan':               `Japanese OnlyFans creators have cultivated some of the platform's most distinctive profiles, blending J-idol aesthetics, kawaii fashion culture, and meticulous production sensibilities that drive premium subscription pricing and exceptional long-term retention. Japan's deep creator economy infrastructure — established idol management, photography studios, and fan club culture — translates directly into professional-grade OnlyFans production.`,
    'brazil':              `Brazilian OnlyFans creators have turned the country's globally recognised aesthetic credentials — carnival culture, beach lifestyle, and natural expressiveness — into some of the platform's highest-engagement profiles. Brazilian creators are among the most-searched international profiles platform-wide, and the community continues to grow rapidly as digital payments infrastructure improves across Brazil.`,
    'colombia':            `Colombian OnlyFans creators represent one of Latin America's most active communities on the platform, combining Bogotá's urban fashion scene with coastal warmth from Cartagena and Medellín and a natural directness in fan communication that subscribers across North America and Europe consistently highlight as a differentiating quality.`,
    'mexico':              `Mexican OnlyFans creators combine rich cultural heritage, coastal aesthetics from Cancún and Puerto Vallarta, and an urban creative scene centred in Mexico City to produce a creator community with remarkable range. Mexico is Latin America's largest single-country creator market on OnlyFans, with a domestic subscriber base that's grown significantly alongside the country's expanding digital payments adoption.`,
    'germany':             `German OnlyFans creators combine European sophistication, direct communication styles, and high production standards that subscriber communities consistently rate for transparency and content quality. Germany's progressive cultural attitudes and digital infrastructure support a thriving premium creator economy that punches well above its weight relative to population size.`,
    'france':              `French OnlyFans creators leverage la dolce vie aesthetics, one of the world's most culturally resonant fashion traditions, and a distinctive creative sensibility that drives premium subscription rates among international audiences seeking refined European content. French creators benefit from a deep domestic creative culture that elevates production quality across the board.`,
    'italy':               `Italian OnlyFans creators draw on la dolce vita, Mediterranean beauty standards, and centuries of fashion and art culture to produce content with an immediately recognisable aesthetic sophistication. Italian creators are particularly well-represented in lifestyle and fashion-adjacent content subcategories, and Rome and Milan producers set production standards for the broader European creator market.`,
    'spain':               `Spanish OnlyFans creators bring Iberian expressiveness, flamenco culture's passion, and a Mediterranean warmth to profiles that resonate equally with Spanish-speaking audiences across Europe and Latin America — one of the broadest natural audience footprints of any European creator market on the platform.`,
    'netherlands':         `Dutch OnlyFans creators benefit from the Netherlands' famously progressive cultural attitudes, excellent digital infrastructure, and near-universal English fluency that makes profiles accessible to global subscriber audiences without language barriers. Amsterdam's established creative industries also supply Dutch creators with professional photography and production resources.`,
    'sweden':              `Swedish OnlyFans creators bring Scandinavian minimalist aesthetics, world-class English fluency, and a cultural openness that has made Nordic profiles consistently popular with international subscribers. Sweden's high internet adoption rate and digital payment maturity also means Swedish creators maintain more active, responsive accounts on average than comparable markets.`,
    'norway':              `Norwegian OnlyFans creators combine natural Nordic beauty, dramatic outdoor landscape aesthetics, and a straightforward authenticity that resonates with subscribers looking for creators who feel genuinely accessible. Norway's high average income and digital sophistication translate into a domestic subscriber base with above-average willingness to pay for premium content.`,
    'ireland':             `Irish OnlyFans creators bring warmth, quick wit, and a distinctly Celtic charm to the platform — from dramatic Atlantic coastal backdrops to the city character of Dublin and Cork. Irish creators consistently receive above-average fan message response ratings, a quality that drives subscription renewals well beyond the global creator average.`,
    'czech-republic':      `Czech OnlyFans creators bring Prague's established creative production infrastructure and decades of European content industry experience to the platform. The Czech creator community has some of the highest average production values in Eastern Europe, with professional photography studios, established talent networks, and above-average content consistency.`,
    'hungary':             `Hungarian OnlyFans creators represent one of Central Europe's most active communities on the platform, with Budapest emerging as a regional content production hub. Hungarian creators combine Eastern European aesthetics with increasingly professional production standards and strong English-language communication skills that drive international subscriber bases.`,
    'romania':             `Romanian OnlyFans creators have grown rapidly into one of the platform's most recognised Eastern European creator communities, driven by high technology adoption, English proficiency, and a diverse range of aesthetic styles. Romania's creator community shows above-average social media cross-platform presence, which drives consistent new subscriber acquisition from Instagram, TikTok, and Twitter traffic.`,
    'ukraine':             `Ukrainian OnlyFans creators have demonstrated extraordinary commitment to their subscriber communities despite challenging circumstances, and that resilience has deepened fan loyalty significantly. The Ukrainian creator community combines Eastern European aesthetic traditions with strong fan communication practices that drive above-average subscription renewal rates.`,
    'south-africa':        `South African OnlyFans creators bring genuine multicultural aesthetic diversity — Cape Town's cosmopolitan beach culture, Johannesburg's urban energy, and a wide range of ethnic and cultural backgrounds across Zulu, Xhosa, Afrikaner, Cape Malay, and Indian South African communities — to produce one of sub-Saharan Africa's most varied creator markets.`,
    'new-zealand':         `New Zealand OnlyFans creators share the outdoor-lifestyle aesthetic of neighbouring Australia but bring a distinctly Kiwi unpretentious warmth that subscribers consistently distinguish from larger markets. New Zealand's small but highly digitally-connected population supports a creator community that punches above its weight in content quality and subscriber engagement.`,
    'thailand':            `Thai OnlyFans creators bring Southeast Asian beauty aesthetics, Bangkok's thriving creative production scene, and a subscriber-first service mentality to profiles that have helped establish Thailand as one of Asia's fastest-growing creator markets. Thai creators show particularly strong performance in custom content requests and PPV upsells.`,
    'singapore':           `Singapore OnlyFans creators benefit from the city-state's world-class digital infrastructure, diverse multicultural aesthetics, and English as an official language — giving Singapore-based profiles immediate accessibility to the platform's largest English-speaking subscriber audiences without language barriers.`,
    'venezuela':           `Venezuelan OnlyFans creators have built a thriving community on the platform, with many creators now operating from international bases across Latin America, North America, and Europe. Venezuelan creators bring a passionate expressiveness and strong fan communication practices that translate into above-average subscriber retention globally.`,
    'puerto-rico':         `Puerto Rican OnlyFans creators bridge Latin and American creator cultures, combining Caribbean warmth, reggaeton and Latin music aesthetics, and full English fluency that gives PR-based creators native access to both the US domestic subscriber market and Spanish-speaking Latin American audiences simultaneously.`,
    'dominican-republic':  `Dominican Republic OnlyFans creators bring Caribbean energy, merengue and bachata cultural aesthetics, and a vibrant Santo Domingo-centred creator scene to profiles that perform particularly well with US Latino and Spanish-speaking subscriber audiences.`,
    'peru':                `Peruvian OnlyFans creators bring Andean and coastal aesthetic diversity together with Lima's growing urban creative scene, producing a creator community that's expanded rapidly alongside Peru's growing digital payments adoption and smartphone penetration rates.`,
    'ecuador':             `Ecuadorian OnlyFans creators represent a growing South American creator community, combining Quito's highland aesthetics with Guayaquil's coastal energy and strong community ties to the large Ecuadorian diaspora in Spain and the United States.`,
    'chile':               `Chilean OnlyFans creators bring Santiago's cosmopolitan urban aesthetic, Valparaíso's bohemian creative energy, and Patagonia-inspired outdoor lifestyle content to profiles that consistently attract strong followings among Spanish-speaking subscriber audiences across the Americas.`,
  };

  const defaultIntro = `${label} OnlyFans creators represent an internationally recognised segment of the platform's creator community in ${year}. The profiles shown above have been ranked by subscriber engagement and fan activity rather than paid placement — so the first results genuinely reflect the most-followed, most-active creators from ${label} available on the platform right now.`;

  const closers = [
    `FansPedia makes browsing ${label} OnlyFans creators faster and more focused than searching the platform directly. All profiles are ranked by real engagement data, updated regularly as creators change their pricing and posting frequency. Use the price filter to match your subscription budget, toggle verified-only to limit results to identity-confirmed accounts, or browse freely and load additional pages to explore the full range of ${label} creator talent.`,
    `Subscribing to a ${label} OnlyFans creator provides direct financial support to that individual's content business — no algorithm cuts, no intermediary fees, no label splits. The profiles ranked here have been verified as real, active accounts. Use the filters at the top of the page to narrow by subscription price or verification status, then click any profile to visit their OnlyFans page directly.`,
    `Not all ${label} OnlyFans accounts are equally active. Posting frequency, DM response time, and subscription pricing vary significantly across the creator landscape. FansPedia surfaces the most engaged creators first — ranked by real fan metrics so you can immediately identify who is actively posting new content versus who has gone quiet. Load more results to explore beyond the top page of ${label} profiles.`,
  ];

  const intro = intros[slug] || defaultIntro;
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const closer = closers[hash % closers.length];

  return `${SEO_INLINE_CSS}<div id="seoBlock" class="seo-inline-block">
  <button id="seoToggleBtn" class="seo-toggle-header" onclick="(function(){var c=document.getElementById('seoContent');var b=document.getElementById('seoToggleBtn');var open=c.classList.toggle('seo-open');c.setAttribute('aria-hidden',String(!open));b.setAttribute('aria-expanded',String(open));})()" aria-expanded="false" aria-controls="seoContent">
    <span class="seo-header-label"><span class="seo-info-icon">&#9432;</span> About ${label} OnlyFans Creators</span>
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
const _countryCache = new Map(); // key → { html, expiresAt }
const COUNTRY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const name = (req.query.name || '').toLowerCase().trim();
  if (!name) return res.status(400).send('Missing country name');

  const config = COUNTRIES[name];
  if (!config) {
    // Unknown country — redirect to home
    return res.redirect(302, '/');
  }

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
    const cached = _countryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
      res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
      return res.status(200).send(cached.html);
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

    // 416 = Range Not Satisfiable: offset is beyond total count → treat as empty page
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

    // --- 2. Read template ---
    const htmlPath = join(ROOT, config.htmlFile);
    let html = readFileSync(htmlPath, 'utf8');

    const canonicalUrl = page > 1
      ? `${BASE_URL}/country/${name}/${page}/`
      : `${BASE_URL}/country/${name}/`;

    const prevLink = page > 2
      ? `<link rel="prev" href="${BASE_URL}/country/${name}/${page - 1}/">`
      : page === 2
        ? `<link rel="prev" href="${BASE_URL}/country/${name}/">`
        : '';
    const nextLink = creators.length === PAGE_SIZE
      ? `<link rel="next" href="${BASE_URL}/country/${name}/${page + 1}/">`
      : '';

    // --- 3. Inject canonical link (update or add) and page title ---
    if (/<link[^>]+rel="canonical"/.test(html)) {
      html = html.replace(
        /(<link[^>]+rel="canonical"[^>]+href=")[^"]*(")/,
        `$1${canonicalUrl}$2`
      );
    } else {
      html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}">\n</head>`);
    }
    // Generate conversion-optimized title + meta description (rotated by slug hash)
    const { title: seoTitle, description: seoDesc } = countrySeoEn(name, config.label, config.metaDesc || '');
    const finalTitle = page > 1 ? `${seoTitle} - Page ${page}` : seoTitle;
    const finalDesc = page > 1 ? `${seoDesc} Page ${page}.` : seoDesc;
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
    // Open Graph + Twitter (add if missing, refresh if present)
    const ogTags = `<meta property="og:title" content="${escHtml(finalTitle)}">
<meta property="og:description" content="${escHtml(finalDesc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(finalTitle)}">
<meta name="twitter:description" content="${escHtml(finalDesc)}">`;
    // Strip any existing og:/twitter: tags then re-inject (idempotent)
    html = html.replace(/\s*<meta\s+(?:property|name)="(?:og:[^"]+|twitter:[^"]+)"[^>]*>/g, '');
    html = html.replace('</head>', `${ogTags}\n</head>`);

    // --- 4. Inject JSON-LD + SSR flag + hreflang + pagination links ---
    const jsonLd = buildJsonLd(name, config.label, creators, canonicalUrl);
    const ssrFlag = `<script>window.__COUNTRY_SSR={name:${JSON.stringify(name)},count:${totalCount},hasMore:${creators.length === PAGE_SIZE},page:${page}};</script>`;
    const paginationLinks = [prevLink, nextLink].filter(Boolean).join('\n');
    // hreflang cross-links: tell Google EN and ES are alternates, not duplicates
    const esCountryUrl = page > 1
      ? `${BASE_URL}/es/country/${name}/${page}/`
      : `${BASE_URL}/es/country/${name}/`;
    const hreflangLinks = [
      `<link rel="alternate" hreflang="en" href="${canonicalUrl}">`,
      `<link rel="alternate" hreflang="es" href="${esCountryUrl}">`,
      `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}">`,
    ].join('\n');
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
    html = html.replace('</head>', `${jsonLd}\n${ssrFlag}\n${hreflangLinks}\n${paginationLinks ? paginationLinks + '\n' : ''}</head>`);

    // --- 5. Pre-rendered creator cards ---
    const cardsHtml = Array.isArray(creators) && creators.length > 0
      ? creators.map((c, i) => renderCard(c, i)).join('\n')
      : `<p class="text-muted text-center w-100 py-4">No creators found from <strong>${escHtml(config.label)}</strong>.</p>`;

    html = html.replace(
      '<div class="row" id="results"></div>',
      `<div class="row" id="results">\n${cardsHtml}\n</div>`
    );

    // --- 5b. Collapsible SEO block above results grid ---
    html = html.replace(
      /<div class="row" id="results">/,
      `${buildCountrySeoSection(name, config.label)}\n<div class="row" id="results">`
    );

    // Store in memory cache so warm instances skip Supabase next request
    _countryCache.set(cacheKey, { html, expiresAt: Date.now() + COUNTRY_CACHE_TTL });

    // --- 6. Send ---
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/country] error:', err.message);
    return res.redirect(302, `/${config.htmlFile}`);
  }
}

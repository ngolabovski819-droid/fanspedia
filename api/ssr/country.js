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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const BASE_URL = 'https://fanspedia.net';
const PAGE_SIZE = 50;
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
        decoding="async" referrerpolicy="no-referrer"
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
    if (page > 1) {
      html = html.replace(
        /<title>([^<]*)<\/title>/,
        `<title>$1 - Page ${page}</title>`
      );
    }

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
    html = html.replace('</head>', `${preloadLink ? preloadLink + '\n' : ''}${jsonLd}\n${ssrFlag}\n${hreflangLinks}\n${paginationLinks ? paginationLinks + '\n' : ''}</head>`);

    // --- 5. Pre-rendered creator cards ---
    const cardsHtml = Array.isArray(creators) && creators.length > 0
      ? creators.map((c, i) => renderCard(c, i)).join('\n')
      : `<p class="text-muted text-center w-100 py-4">No creators found from <strong>${escHtml(config.label)}</strong>.</p>`;

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
    console.error('[ssr/country] error:', err.message);
    return res.redirect(302, `/${config.htmlFile}`);
  }
}

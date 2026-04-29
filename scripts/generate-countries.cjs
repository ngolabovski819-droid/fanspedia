/**
 * generate-countries.cjs
 * One-shot script: creates all missing country HTML files + patches 6 config files.
 * Run: node scripts/generate-countries.cjs
 * Delete this script after running.
 */

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// Country data — slug, label, terms, adjective, Spanish label
// ---------------------------------------------------------------------------
const NEW_COUNTRIES = [
  { slug: 'armenia',              label: 'Armenia',                 terms: ['armenia', 'armenian', 'yerevan'],                                               adj: 'Armenian',        esLabel: 'Armenia',                  esDe: 'de Armenia' },
  { slug: 'australia',            label: 'Australia',               terms: ['australia', 'australian', 'sydney', 'melbourne', 'brisbane'],                    adj: 'Australian',      esLabel: 'Australia',                esDe: 'de Australia' },
  { slug: 'austria',              label: 'Austria',                 terms: ['austria', 'austrian', 'vienna', 'wien'],                                         adj: 'Austrian',        esLabel: 'Austria',                  esDe: 'de Austria' },
  { slug: 'bahamas',              label: 'Bahamas',                 terms: ['bahamas', 'bahamian', 'nassau'],                                                 adj: 'Bahamian',        esLabel: 'Bahamas',                  esDe: 'de Bahamas' },
  { slug: 'barbados',             label: 'Barbados',                terms: ['barbados', 'barbadian', 'bridgetown'],                                           adj: 'Barbadian',       esLabel: 'Barbados',                 esDe: 'de Barbados' },
  { slug: 'belarus',              label: 'Belarus',                 terms: ['belarus', 'belarusian', 'minsk'],                                                adj: 'Belarusian',      esLabel: 'Bielorrusia',              esDe: 'de Bielorrusia' },
  { slug: 'belgium',              label: 'Belgium',                 terms: ['belgium', 'belgian', 'brussels'],                                                adj: 'Belgian',         esLabel: 'Bélgica',                  esDe: 'de Bélgica' },
  { slug: 'bolivia',              label: 'Bolivia',                 terms: ['bolivia', 'bolivian', 'la paz', 'santa cruz'],                                   adj: 'Bolivian',        esLabel: 'Bolivia',                  esDe: 'de Bolivia' },
  { slug: 'bosnia-and-herzegovina', label: 'Bosnia and Herzegovina', terms: ['bosnia', 'bosnian', 'herzegovina', 'sarajevo'],                                adj: 'Bosnian',         esLabel: 'Bosnia y Herzegovina',     esDe: 'de Bosnia y Herzegovina' },
  { slug: 'brazil',               label: 'Brazil',                  terms: ['brazil', 'brazilian', 'brasil', 'rio de janeiro', 'sao paulo'],                  adj: 'Brazilian',       esLabel: 'Brasil',                   esDe: 'de Brasil' },
  { slug: 'bulgaria',             label: 'Bulgaria',                terms: ['bulgaria', 'bulgarian', 'sofia'],                                                adj: 'Bulgarian',       esLabel: 'Bulgaria',                 esDe: 'de Bulgaria' },
  { slug: 'cambodia',             label: 'Cambodia',                terms: ['cambodia', 'cambodian', 'phnom penh'],                                           adj: 'Cambodian',       esLabel: 'Camboya',                  esDe: 'de Camboya' },
  { slug: 'chile',                label: 'Chile',                   terms: ['chile', 'chilean', 'santiago', 'chilena'],                                       adj: 'Chilean',         esLabel: 'Chile',                    esDe: 'de Chile' },
  { slug: 'china',                label: 'China',                   terms: ['china', 'chinese', 'beijing', 'shanghai'],                                       adj: 'Chinese',         esLabel: 'China',                    esDe: 'de China' },
  { slug: 'colombia',             label: 'Colombia',                terms: ['colombia', 'colombian', 'bogota', 'medellin', 'colombiana'],                      adj: 'Colombian',       esLabel: 'Colombia',                 esDe: 'de Colombia' },
  { slug: 'costa-rica',           label: 'Costa Rica',              terms: ['costa rica', 'costa rican', 'san jose', 'tica'],                                 adj: 'Costa Rican',     esLabel: 'Costa Rica',               esDe: 'de Costa Rica' },
  { slug: 'croatia',              label: 'Croatia',                 terms: ['croatia', 'croatian', 'zagreb'],                                                 adj: 'Croatian',        esLabel: 'Croacia',                  esDe: 'de Croacia' },
  { slug: 'cuba',                 label: 'Cuba',                    terms: ['cuba', 'cuban', 'havana', 'cubana'],                                             adj: 'Cuban',           esLabel: 'Cuba',                     esDe: 'de Cuba' },
  { slug: 'cyprus',               label: 'Cyprus',                  terms: ['cyprus', 'cypriot', 'nicosia'],                                                  adj: 'Cypriot',         esLabel: 'Chipre',                   esDe: 'de Chipre' },
  { slug: 'czech-republic',       label: 'Czech Republic',          terms: ['czech', 'czech republic', 'czechia', 'prague'],                                  adj: 'Czech',           esLabel: 'República Checa',          esDe: 'de República Checa' },
  { slug: 'denmark',              label: 'Denmark',                 terms: ['denmark', 'danish', 'copenhagen'],                                               adj: 'Danish',          esLabel: 'Dinamarca',                esDe: 'de Dinamarca' },
  { slug: 'dominican-republic',   label: 'Dominican Republic',      terms: ['dominican', 'dominican republic', 'santo domingo', 'dominicana'],                adj: 'Dominican',       esLabel: 'República Dominicana',     esDe: 'de República Dominicana' },
  { slug: 'ecuador',              label: 'Ecuador',                 terms: ['ecuador', 'ecuadorian', 'quito', 'guayaquil', 'ecuatoriana'],                     adj: 'Ecuadorian',      esLabel: 'Ecuador',                  esDe: 'de Ecuador' },
  { slug: 'egypt',                label: 'Egypt',                   terms: ['egypt', 'egyptian', 'cairo', 'alexandria'],                                      adj: 'Egyptian',        esLabel: 'Egipto',                   esDe: 'de Egipto' },
  { slug: 'el-salvador',          label: 'El Salvador',             terms: ['el salvador', 'salvadoran', 'san salvador'],                                     adj: 'Salvadoran',      esLabel: 'El Salvador',              esDe: 'de El Salvador' },
  { slug: 'estonia',              label: 'Estonia',                 terms: ['estonia', 'estonian', 'tallinn'],                                                adj: 'Estonian',        esLabel: 'Estonia',                  esDe: 'de Estonia' },
  { slug: 'finland',              label: 'Finland',                 terms: ['finland', 'finnish', 'helsinki'],                                                adj: 'Finnish',         esLabel: 'Finlandia',                esDe: 'de Finlandia' },
  { slug: 'france',               label: 'France',                  terms: ['france', 'french', 'paris', 'française'],                                        adj: 'French',          esLabel: 'Francia',                  esDe: 'de Francia' },
  { slug: 'georgia',              label: 'Georgia',                 terms: ['georgia country', 'georgian', 'tbilisi'],                                        adj: 'Georgian',        esLabel: 'Georgia',                  esDe: 'de Georgia' },
  { slug: 'germany',              label: 'Germany',                 terms: ['germany', 'german', 'berlin', 'deutschland'],                                    adj: 'German',          esLabel: 'Alemania',                 esDe: 'de Alemania' },
  { slug: 'ghana',                label: 'Ghana',                   terms: ['ghana', 'ghanaian', 'accra'],                                                    adj: 'Ghanaian',        esLabel: 'Ghana',                    esDe: 'de Ghana' },
  { slug: 'greece',               label: 'Greece',                  terms: ['greece', 'greek', 'athens', 'hellenic'],                                         adj: 'Greek',           esLabel: 'Grecia',                   esDe: 'de Grecia' },
  { slug: 'guam',                 label: 'Guam',                    terms: ['guam', 'guamanian', 'chamorro'],                                                 adj: 'Guamanian',       esLabel: 'Guam',                     esDe: 'de Guam' },
  { slug: 'guatemala',            label: 'Guatemala',               terms: ['guatemala', 'guatemalan', 'guatemalteca'],                                       adj: 'Guatemalan',      esLabel: 'Guatemala',                esDe: 'de Guatemala' },
  { slug: 'honduras',             label: 'Honduras',                terms: ['honduras', 'honduran', 'tegucigalpa', 'hondureña'],                               adj: 'Honduran',        esLabel: 'Honduras',                 esDe: 'de Honduras' },
  { slug: 'hong-kong',            label: 'Hong Kong',               terms: ['hong kong', 'hongkong', 'hk'],                                                   adj: 'Hong Kong',       esLabel: 'Hong Kong',                esDe: 'de Hong Kong' },
  { slug: 'hungary',              label: 'Hungary',                 terms: ['hungary', 'hungarian', 'budapest'],                                              adj: 'Hungarian',       esLabel: 'Hungría',                  esDe: 'de Hungría' },
  { slug: 'iceland',              label: 'Iceland',                 terms: ['iceland', 'icelandic', 'reykjavik'],                                             adj: 'Icelandic',       esLabel: 'Islandia',                 esDe: 'de Islandia' },
  { slug: 'indonesia',            label: 'Indonesia',               terms: ['indonesia', 'indonesian', 'jakarta', 'bali'],                                    adj: 'Indonesian',      esLabel: 'Indonesia',                esDe: 'de Indonesia' },
  { slug: 'ireland',              label: 'Ireland',                 terms: ['ireland', 'irish', 'dublin'],                                                    adj: 'Irish',           esLabel: 'Irlanda',                  esDe: 'de Irlanda' },
  { slug: 'israel',               label: 'Israel',                  terms: ['israel', 'israeli', 'tel aviv', 'jerusalem'],                                    adj: 'Israeli',         esLabel: 'Israel',                   esDe: 'de Israel' },
  { slug: 'italy',                label: 'Italy',                   terms: ['italy', 'italian', 'rome', 'milan', 'italia', 'italiana'],                        adj: 'Italian',         esLabel: 'Italia',                   esDe: 'de Italia' },
  { slug: 'jamaica',              label: 'Jamaica',                 terms: ['jamaica', 'jamaican', 'kingston'],                                               adj: 'Jamaican',        esLabel: 'Jamaica',                  esDe: 'de Jamaica' },
  { slug: 'kenya',                label: 'Kenya',                   terms: ['kenya', 'kenyan', 'nairobi'],                                                    adj: 'Kenyan',          esLabel: 'Kenia',                    esDe: 'de Kenia' },
  { slug: 'latvia',               label: 'Latvia',                  terms: ['latvia', 'latvian', 'riga'],                                                     adj: 'Latvian',         esLabel: 'Letonia',                  esDe: 'de Letonia' },
  { slug: 'lebanon',              label: 'Lebanon',                 terms: ['lebanon', 'lebanese', 'beirut'],                                                 adj: 'Lebanese',        esLabel: 'Líbano',                   esDe: 'del Líbano' },
  { slug: 'lithuania',            label: 'Lithuania',               terms: ['lithuania', 'lithuanian', 'vilnius'],                                            adj: 'Lithuanian',      esLabel: 'Lituania',                 esDe: 'de Lituania' },
  { slug: 'luxembourg',           label: 'Luxembourg',              terms: ['luxembourg', 'luxembourgish'],                                                   adj: 'Luxembourgish',   esLabel: 'Luxemburgo',               esDe: 'de Luxemburgo' },
  { slug: 'malaysia',             label: 'Malaysia',                terms: ['malaysia', 'malaysian', 'kuala lumpur'],                                         adj: 'Malaysian',       esLabel: 'Malasia',                  esDe: 'de Malasia' },
  { slug: 'malta',                label: 'Malta',                   terms: ['malta', 'maltese', 'valletta'],                                                  adj: 'Maltese',         esLabel: 'Malta',                    esDe: 'de Malta' },
  { slug: 'mexico',               label: 'Mexico',                  terms: ['mexico', 'mexican', 'mexico city', 'guadalajara', 'mexicana'],                    adj: 'Mexican',         esLabel: 'México',                   esDe: 'de México' },
  { slug: 'moldova',              label: 'Moldova',                 terms: ['moldova', 'moldovan', 'chisinau'],                                               adj: 'Moldovan',        esLabel: 'Moldavia',                 esDe: 'de Moldavia' },
  { slug: 'monaco',               label: 'Monaco',                  terms: ['monaco', 'monegasque', 'monte carlo'],                                           adj: 'Monégasque',      esLabel: 'Mónaco',                   esDe: 'de Mónaco' },
  { slug: 'montenegro',           label: 'Montenegro',              terms: ['montenegro', 'montenegrin', 'podgorica'],                                        adj: 'Montenegrin',     esLabel: 'Montenegro',               esDe: 'de Montenegro' },
  { slug: 'morocco',              label: 'Morocco',                 terms: ['morocco', 'moroccan', 'casablanca', 'marrakech'],                                 adj: 'Moroccan',        esLabel: 'Marruecos',                esDe: 'de Marruecos' },
  { slug: 'netherlands',          label: 'Netherlands',             terms: ['netherlands', 'dutch', 'holland', 'amsterdam'],                                  adj: 'Dutch',           esLabel: 'Países Bajos',             esDe: 'de Países Bajos' },
  { slug: 'new-zealand',          label: 'New Zealand',             terms: ['new zealand', 'nz', 'kiwi', 'auckland', 'wellington'],                            adj: 'New Zealander',   esLabel: 'Nueva Zelanda',            esDe: 'de Nueva Zelanda' },
  { slug: 'nigeria',              label: 'Nigeria',                 terms: ['nigeria', 'nigerian', 'lagos', 'abuja'],                                         adj: 'Nigerian',        esLabel: 'Nigeria',                  esDe: 'de Nigeria' },
  { slug: 'norway',               label: 'Norway',                  terms: ['norway', 'norwegian', 'oslo'],                                                   adj: 'Norwegian',       esLabel: 'Noruega',                  esDe: 'de Noruega' },
  { slug: 'pakistan',             label: 'Pakistan',                terms: ['pakistan', 'pakistani', 'karachi', 'lahore', 'islamabad'],                        adj: 'Pakistani',       esLabel: 'Pakistán',                 esDe: 'de Pakistán' },
  { slug: 'panama',               label: 'Panama',                  terms: ['panama', 'panamanian', 'panama city', 'panameña'],                                adj: 'Panamanian',      esLabel: 'Panamá',                   esDe: 'de Panamá' },
  { slug: 'paraguay',             label: 'Paraguay',                terms: ['paraguay', 'paraguayan', 'asuncion', 'paraguaya'],                                adj: 'Paraguayan',      esLabel: 'Paraguay',                 esDe: 'de Paraguay' },
  { slug: 'peru',                 label: 'Peru',                    terms: ['peru', 'peruvian', 'lima', 'peruana'],                                           adj: 'Peruvian',        esLabel: 'Perú',                     esDe: 'de Perú' },
  { slug: 'poland',               label: 'Poland',                  terms: ['poland', 'polish', 'warsaw', 'krakow', 'polska'],                                adj: 'Polish',          esLabel: 'Polonia',                  esDe: 'de Polonia' },
  { slug: 'portugal',             label: 'Portugal',                terms: ['portugal', 'portuguese', 'lisbon', 'porto', 'portuguesa'],                        adj: 'Portuguese',      esLabel: 'Portugal',                 esDe: 'de Portugal' },
  { slug: 'puerto-rico',          label: 'Puerto Rico',             terms: ['puerto rico', 'puerto rican', 'san juan', 'boricua'],                             adj: 'Puerto Rican',    esLabel: 'Puerto Rico',              esDe: 'de Puerto Rico' },
  { slug: 'romania',              label: 'Romania',                 terms: ['romania', 'romanian', 'bucharest'],                                              adj: 'Romanian',        esLabel: 'Rumania',                  esDe: 'de Rumania' },
  { slug: 'russia',               label: 'Russia',                  terms: ['russia', 'russian', 'moscow', 'saint petersburg'],                               adj: 'Russian',         esLabel: 'Rusia',                    esDe: 'de Rusia' },
  { slug: 'saudi-arabia',         label: 'Saudi Arabia',            terms: ['saudi arabia', 'saudi', 'riyadh', 'jeddah'],                                     adj: 'Saudi',           esLabel: 'Arabia Saudita',           esDe: 'de Arabia Saudita' },
  { slug: 'scotland',             label: 'Scotland',                terms: ['scotland', 'scottish', 'edinburgh', 'glasgow'],                                  adj: 'Scottish',        esLabel: 'Escocia',                  esDe: 'de Escocia' },
  { slug: 'serbia',               label: 'Serbia',                  terms: ['serbia', 'serbian', 'belgrade'],                                                 adj: 'Serbian',         esLabel: 'Serbia',                   esDe: 'de Serbia' },
  { slug: 'singapore',            label: 'Singapore',               terms: ['singapore', 'singaporean'],                                                      adj: 'Singaporean',     esLabel: 'Singapur',                 esDe: 'de Singapur' },
  { slug: 'slovakia',             label: 'Slovakia',                terms: ['slovakia', 'slovak', 'bratislava'],                                              adj: 'Slovak',          esLabel: 'Eslovaquia',               esDe: 'de Eslovaquia' },
  { slug: 'slovenia',             label: 'Slovenia',                terms: ['slovenia', 'slovenian', 'ljubljana'],                                            adj: 'Slovenian',       esLabel: 'Eslovenia',                esDe: 'de Eslovenia' },
  { slug: 'south-africa',         label: 'South Africa',            terms: ['south africa', 'south african', 'cape town', 'johannesburg'],                    adj: 'South African',   esLabel: 'Sudáfrica',                esDe: 'de Sudáfrica' },
  { slug: 'south-korea',          label: 'South Korea',             terms: ['south korea', 'korean', 'seoul', 'kpop', 'k-pop'],                               adj: 'Korean',          esLabel: 'Corea del Sur',            esDe: 'de Corea del Sur' },
  { slug: 'spain',                label: 'Spain',                   terms: ['spain', 'spanish', 'madrid', 'barcelona', 'española'],                           adj: 'Spanish',         esLabel: 'España',                   esDe: 'de España' },
  { slug: 'sri-lanka',            label: 'Sri Lanka',               terms: ['sri lanka', 'sri lankan', 'colombo', 'ceylon'],                                  adj: 'Sri Lankan',      esLabel: 'Sri Lanka',                esDe: 'de Sri Lanka' },
  { slug: 'sweden',               label: 'Sweden',                  terms: ['sweden', 'swedish', 'stockholm'],                                                adj: 'Swedish',         esLabel: 'Suecia',                   esDe: 'de Suecia' },
  { slug: 'switzerland',          label: 'Switzerland',             terms: ['switzerland', 'swiss', 'zurich', 'geneva'],                                      adj: 'Swiss',           esLabel: 'Suiza',                    esDe: 'de Suiza' },
  { slug: 'taiwan',               label: 'Taiwan',                  terms: ['taiwan', 'taiwanese', 'taipei'],                                                 adj: 'Taiwanese',       esLabel: 'Taiwán',                   esDe: 'de Taiwán' },
  { slug: 'thailand',             label: 'Thailand',                terms: ['thailand', 'thai', 'bangkok'],                                                   adj: 'Thai',            esLabel: 'Tailandia',                esDe: 'de Tailandia' },
  { slug: 'trinidad-and-tobago',  label: 'Trinidad and Tobago',     terms: ['trinidad', 'tobago', 'trinidadian', 'port of spain'],                            adj: 'Trinidadian',     esLabel: 'Trinidad y Tobago',        esDe: 'de Trinidad y Tobago' },
  { slug: 'tunisia',              label: 'Tunisia',                 terms: ['tunisia', 'tunisian', 'tunis'],                                                  adj: 'Tunisian',        esLabel: 'Túnez',                    esDe: 'de Túnez' },
  { slug: 'turkey',               label: 'Turkey',                  terms: ['turkey', 'turkish', 'istanbul', 'ankara'],                                       adj: 'Turkish',         esLabel: 'Turquía',                  esDe: 'de Turquía' },
  { slug: 'ukraine',              label: 'Ukraine',                 terms: ['ukraine', 'ukrainian', 'kyiv', 'odessa'],                                        adj: 'Ukrainian',       esLabel: 'Ucrania',                  esDe: 'de Ucrania' },
  { slug: 'united-arab-emirates', label: 'United Arab Emirates',    terms: ['uae', 'emirates', 'dubai', 'abu dhabi'],                                         adj: 'Emirati',         esLabel: 'Emiratos Árabes Unidos',   esDe: 'de Emiratos Árabes Unidos' },
  { slug: 'uruguay',              label: 'Uruguay',                 terms: ['uruguay', 'uruguayan', 'montevideo', 'uruguaya'],                                adj: 'Uruguayan',       esLabel: 'Uruguay',                  esDe: 'de Uruguay' },
  { slug: 'venezuela',            label: 'Venezuela',               terms: ['venezuela', 'venezuelan', 'caracas', 'venezolana'],                              adj: 'Venezuelan',      esLabel: 'Venezuela',                esDe: 'de Venezuela' },
  { slug: 'vietnam',              label: 'Vietnam',                 terms: ['vietnam', 'vietnamese', 'ho chi minh', 'hanoi'],                                 adj: 'Vietnamese',      esLabel: 'Vietnam',                  esDe: 'de Vietnam' },
];

// Country code map for locations.html chips
const COUNTRY_CODES = {
  'armenia': 'AM', 'australia': 'AU', 'austria': 'AT', 'bahamas': 'BS', 'barbados': 'BB',
  'belarus': 'BY', 'belgium': 'BE', 'bolivia': 'BO', 'bosnia-and-herzegovina': 'BA',
  'brazil': 'BR', 'bulgaria': 'BG', 'cambodia': 'KH', 'chile': 'CL', 'china': 'CN',
  'colombia': 'CO', 'costa-rica': 'CR', 'croatia': 'HR', 'cuba': 'CU', 'cyprus': 'CY',
  'czech-republic': 'CZ', 'denmark': 'DK', 'dominican-republic': 'DO', 'ecuador': 'EC',
  'egypt': 'EG', 'el-salvador': 'SV', 'estonia': 'EE', 'finland': 'FI', 'france': 'FR',
  'georgia': 'GE', 'germany': 'DE', 'ghana': 'GH', 'greece': 'GR', 'guam': 'GU',
  'guatemala': 'GT', 'honduras': 'HN', 'hong-kong': 'HK', 'hungary': 'HU', 'iceland': 'IS',
  'indonesia': 'ID', 'ireland': 'IE', 'israel': 'IL', 'italy': 'IT', 'jamaica': 'JM',
  'kenya': 'KE', 'latvia': 'LV', 'lebanon': 'LB', 'lithuania': 'LT', 'luxembourg': 'LU',
  'malaysia': 'MY', 'malta': 'MT', 'mexico': 'MX', 'moldova': 'MD', 'monaco': 'MC',
  'montenegro': 'ME', 'morocco': 'MA', 'netherlands': 'NL', 'new-zealand': 'NZ',
  'nigeria': 'NG', 'norway': 'NO', 'pakistan': 'PK', 'panama': 'PA', 'paraguay': 'PY',
  'peru': 'PE', 'poland': 'PL', 'portugal': 'PT', 'puerto-rico': 'PR', 'romania': 'RO',
  'russia': 'RU', 'saudi-arabia': 'SA', 'scotland': 'SC', 'serbia': 'RS', 'singapore': 'SG',
  'slovakia': 'SK', 'slovenia': 'SI', 'south-africa': 'ZA', 'south-korea': 'KR',
  'spain': 'ES', 'sri-lanka': 'LK', 'sweden': 'SE', 'switzerland': 'CH', 'taiwan': 'TW',
  'thailand': 'TH', 'trinidad-and-tobago': 'TT', 'tunisia': 'TN', 'turkey': 'TR',
  'ukraine': 'UA', 'united-arab-emirates': 'AE', 'uruguay': 'UY', 'venezuela': 'VE',
  'vietnam': 'VN',
};

const YEAR = new Date().getFullYear();

// Helper to read file with normalized line endings
function readFile(p) { return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n'); }
// 1. Generate HTML files from argentina.html template
// ---------------------------------------------------------------------------
console.log('\n📄 Generating HTML files...');
const templatePath = path.join(ROOT, 'argentina.html');
const template = readFile(templatePath);

for (const c of NEW_COUNTRIES) {
  const htmlFile = path.join(ROOT, `${c.slug}.html`);
  if (fs.existsSync(htmlFile)) { console.log(`  ⏭  ${c.slug}.html already exists`); continue; }

  const termsJs = JSON.stringify(c.terms);

  let html = template
    // Title
    .replace(
      '<title>Best OnlyFans Creators in Argentina | FansPedia</title>',
      `<title>Best OnlyFans Creators in ${c.label} | FansPedia</title>`
    )
    // Meta description
    .replace(
      'content="Discover the most popular OnlyFans creators from Argentina. Browse verified profiles, free accounts, and exclusive content from Argentine creators."',
      `content="Discover the most popular OnlyFans creators from ${c.label}. Browse verified profiles, free accounts, and exclusive content from ${c.adj} creators."`
    )
    // h1
    .replace(
      '<h1 class="page-title">The Best OnlyFans Creators From Argentina</h1>',
      `<h1 class="page-title">The Best OnlyFans Creators From ${c.label}</h1>`
    )
    // status text
    .replace(
      "statusDiv.textContent = append ? 'Loading more...' : 'Loading creators from Argentina...';",
      `statusDiv.textContent = append ? 'Loading more...' : 'Loading creators from ${c.label}...';`
    )
    // countryTermsArr
    .replace(
      "const countryTermsArr = ['argentina', 'argentinian', 'argentine', 'buenos aires'];",
      `const countryTermsArr = ${termsJs};`
    )
    // SEO heading
    .replace(
      /<h2 id="argentina-seo-title"[^>]*>[\s\S]*?<\/h2>/,
      `<h2 style="color:#00AFF0;font-weight:700;font-size:28px;margin-bottom:20px;">${c.adj} OnlyFans Creators: Discover the Best ${c.label} OnlyFans Profiles</h2>`
    )
    // Remove the long Argentina SEO paragraphs — replace with a generic block
    // (SSR handler overwrites this anyway for Googlebot)
    .replace(
      /(<h2 style="color:#00AFF0.*?<\/h2>)\s*<p[^>]*>Argentine OnlyFans creators[\s\S]*?(?=<h2 style="color:#00AFF0)/,
      `$1\n    <p style="color:var(--text-primary);font-size:16px;line-height:1.7;margin-bottom:16px;">${c.adj} OnlyFans creators offer diverse content across fashion, fitness, lifestyle, and more. Browse profiles below to find your favorites.</p>\n    `
    )
    // Footer link
    .replace(
      '<a href="/country/argentina/">Argentina</a>',
      `<a href="/country/${c.slug}/">${c.label}</a>`
    )
    .replace(
      '<li><a href="/country/argentina">Argentina</a></li>',
      `<li><a href="/country/${c.slug}">${c.label}</a></li>`
    );

  fs.writeFileSync(htmlFile, html, 'utf8');
  console.log(`  ✅ Created ${c.slug}.html`);
}

// ---------------------------------------------------------------------------
// 2. Update api/ssr/country.js — append to COUNTRIES map
// ---------------------------------------------------------------------------
console.log('\n🗺  Updating api/ssr/country.js...');
const countryJsPath = path.join(ROOT, 'api', 'ssr', 'country.js');
let countryJs = readFile(countryJsPath);

const newCountryEntries = NEW_COUNTRIES.map(c => {
  const termsJs = JSON.stringify(c.terms);
  return `  '${c.slug}': {
    terms: ${termsJs},
    label: '${c.label}',
    htmlFile: '${c.slug}.html',
    h1: 'The Best OnlyFans Creators From ${c.label}',
    metaDesc: 'Discover the most popular OnlyFans creators from ${c.label}. Browse verified profiles, free accounts, and exclusive content from ${c.adj} creators.',
  },`;
}).join('\n');

// Insert before the closing brace of COUNTRIES (after japan entry)
const COUNTRY_JS_ANCHOR = `    metaDesc: 'Discover the most popular OnlyFans creators across Japan. Browse verified profiles, free accounts, and exclusive content from Japanese creators.',\n  },\n};`;
if (!countryJs.includes(COUNTRY_JS_ANCHOR)) {
  console.error('  ⚠️  Could not find anchor in country.js — check file manually');
} else {
  countryJs = countryJs.replace(
    COUNTRY_JS_ANCHOR,
    `    metaDesc: 'Discover the most popular OnlyFans creators across Japan. Browse verified profiles, free accounts, and exclusive content from Japanese creators.',\n  },\n${newCountryEntries}\n};`
  );
}
fs.writeFileSync(countryJsPath, countryJs, 'utf8');
console.log('  ✅ country.js updated');

// ---------------------------------------------------------------------------
// 3. Update api/ssr/es-country.js — append to COUNTRIES map
// ---------------------------------------------------------------------------
console.log('\n🗺  Updating api/ssr/es-country.js...');
const esCountryJsPath = path.join(ROOT, 'api', 'ssr', 'es-country.js');
let esCountryJs = readFile(esCountryJsPath);

const newEsCountryEntries = NEW_COUNTRIES.map(c => {
  const termsJs = JSON.stringify(c.terms);
  return `  '${c.slug}': {
    terms: ${termsJs},
    label: '${c.esLabel}',
    htmlFile: 'es/${c.slug}.html',
    h1: 'Las Mejores Creadoras de OnlyFans ${c.esDe}',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares ${c.esDe}. Explora perfiles verificados, cuentas gratis y contenido exclusivo.',
    titleEs: \`Mejores Creadoras de OnlyFans ${c.esDe.replace(/'/g, "\\'")} (\${YEAR}) | FansPedia\`,
  },`;
}).join('\n');

// Insert before the closing brace of COUNTRIES in es-country.js
// Use String.raw to avoid template literal issues with ${YEAR}
const ES_COUNTRY_JS_ANCHOR = '    titleEs: `Mejores Creadoras de OnlyFans en Japón (${YEAR}) | FansPedia`,\n  },\n};';
if (!esCountryJs.includes(ES_COUNTRY_JS_ANCHOR)) {
  console.error('  ⚠️  Could not find anchor in es-country.js — check file manually');
} else {
  esCountryJs = esCountryJs.replace(
    ES_COUNTRY_JS_ANCHOR,
    '    titleEs: `Mejores Creadoras de OnlyFans en Japón (${YEAR}) | FansPedia`,\n  },\n' + newEsCountryEntries + '\n};'
  );
}
fs.writeFileSync(esCountryJsPath, esCountryJs, 'utf8');
console.log('  ✅ es-country.js updated');

// ---------------------------------------------------------------------------
// 4. Update vercel.json — rewrites EN, rewrites ES, redirects canonical, redirects .html
// ---------------------------------------------------------------------------
console.log('\n⚙️  Updating vercel.json...');
const vercelPath = path.join(ROOT, 'vercel.json');
let vercelJson = readFile(vercelPath);

// EN rewrites — insert after philippines pair
const enRewrites = '\n' + NEW_COUNTRIES.map(c =>
  `    { "source": "/country/${c.slug}", "destination": "/api/ssr/country?name=${c.slug}" },\n    { "source": "/country/${c.slug}/", "destination": "/api/ssr/country?name=${c.slug}" },`
).join('\n');

const EN_ANCHOR = '    { "source": "/country/philippines/", "destination": "/api/ssr/country?name=philippines" },';
vercelJson = vercelJson.replace(EN_ANCHOR, EN_ANCHOR + enRewrites);

// ES rewrites — insert after es/country/philippines pair
const esRewrites = '\n' + NEW_COUNTRIES.map(c =>
  `    { "source": "/es/country/${c.slug}", "destination": "/api/ssr/es-country?name=${c.slug}" },\n    { "source": "/es/country/${c.slug}/", "destination": "/api/ssr/es-country?name=${c.slug}" },`
).join('\n');

const ES_ANCHOR = '    { "source": "/es/country/philippines/", "destination": "/api/ssr/es-country?name=philippines" },';
vercelJson = vercelJson.replace(ES_ANCHOR, ES_ANCHOR + esRewrites);

// Canonical 301 redirects — insert after philippines canonical redirect
const canonicalRedirects = '\n' + NEW_COUNTRIES.map(c =>
  `    { "source": "/country/${c.slug}", "destination": "/country/${c.slug}/", "statusCode": 301 },`
).join('\n');

const CANON_ANCHOR = '    { "source": "/country/philippines",    "destination": "/country/philippines/",    "statusCode": 301 },';
vercelJson = vercelJson.replace(CANON_ANCHOR, CANON_ANCHOR + canonicalRedirects);

// .html redirects — insert after the es/philippines.html redirect
const htmlRedirects = '\n' + NEW_COUNTRIES.map(c =>
  `    { "source": "/${c.slug}.html", "destination": "/country/${c.slug}/", "statusCode": 301 },\n    { "source": "/es/${c.slug}.html", "destination": "/es/country/${c.slug}/", "statusCode": 301 },`
).join('\n');

const HTML_ANCHOR = '    { "source": "/es/philippines.html", "destination": "/es/country/philippines/", "statusCode": 301 },';
vercelJson = vercelJson.replace(HTML_ANCHOR, HTML_ANCHOR + htmlRedirects);

fs.writeFileSync(vercelPath, vercelJson, 'utf8');
console.log('  ✅ vercel.json updated');

// ---------------------------------------------------------------------------
// 5. Update scripts/build-sitemaps.cjs — countries array (2 places)
// ---------------------------------------------------------------------------
console.log('\n🗺  Updating build-sitemaps.cjs...');
const sitemapsPath = path.join(ROOT, 'scripts', 'build-sitemaps.cjs');
let sitemapsCjs = readFile(sitemapsPath);

const newSlugs = NEW_COUNTRIES.map(c => `'${c.slug}'`).join(', ');
const slugsToAdd = `, ${newSlugs}`;

// Both buildBaseSitemap and buildSpanishBaseSitemap have the same countries array pattern
sitemapsCjs = sitemapsCjs.replace(
  /const countries = \['united-states', 'canada', 'india', 'japan', 'argentina', 'united-kingdom', 'philippines'\];/g,
  `const countries = ['united-states', 'canada', 'india', 'japan', 'argentina', 'united-kingdom', 'philippines'${slugsToAdd}];`
);

fs.writeFileSync(sitemapsPath, sitemapsCjs, 'utf8');
console.log('  ✅ build-sitemaps.cjs updated');

// ---------------------------------------------------------------------------
// 6. Update scripts/build-spanish-pages.cjs
// ---------------------------------------------------------------------------
console.log('\n🌐  Updating build-spanish-pages.cjs...');
const spanishPath = path.join(ROOT, 'scripts', 'build-spanish-pages.cjs');
let spanishCjs = readFile(spanishPath);

// Add to COUNTRY_PAGES array
const newPageEntries = NEW_COUNTRIES.map(c => `  '${c.slug}.html',`).join('\n');
spanishCjs = spanishCjs.replace(
  "  'philippines.html'\n];",
  `  'philippines.html',\n${newPageEntries}\n];`
);

// Add pageName detection entries
const newPageNameEntries = NEW_COUNTRIES.map(c =>
  `  else if (result.includes('${c.slug}.html')) pageName = '${c.slug}.html';`
).join('\n');
spanishCjs = spanishCjs.replace(
  "  else if (result.includes('philippines.html')) pageName = 'philippines.html';",
  `  else if (result.includes('philippines.html')) pageName = 'philippines.html';\n${newPageNameEntries}`
);

fs.writeFileSync(spanishPath, spanishCjs, 'utf8');
console.log('  ✅ build-spanish-pages.cjs updated');

// ---------------------------------------------------------------------------
// 7. Update locations.html — add url: to all new country chips
// ---------------------------------------------------------------------------
console.log('\n📍 Updating locations.html...');
const locationsPath = path.join(ROOT, 'locations.html');
let locationsHtml = readFile(locationsPath);

for (const c of NEW_COUNTRIES) {
  const code = COUNTRY_CODES[c.slug] || c.slug.toUpperCase().slice(0, 2);
  // Pattern: { code: 'XX', name: 'Label' } — add url if not present
  const withoutUrl = new RegExp(
    `(\\{ code: '${code}', name: '${c.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}' \\})`,
    'g'
  );
  locationsHtml = locationsHtml.replace(
    withoutUrl,
    `{ code: '${code}', name: '${c.label}', url: '/country/${c.slug}/' }`
  );
}

fs.writeFileSync(locationsPath, locationsHtml, 'utf8');
console.log('  ✅ locations.html updated');

// ---------------------------------------------------------------------------
// 8. Update es/locations.html — same
// ---------------------------------------------------------------------------
console.log('\n📍 Updating es/locations.html...');
const esLocationsPath = path.join(ROOT, 'es', 'locations.html');
if (fs.existsSync(esLocationsPath)) {
  let esLocationsHtml = readFile(esLocationsPath);
  for (const c of NEW_COUNTRIES) {
    const code = COUNTRY_CODES[c.slug] || c.slug.toUpperCase().slice(0, 2);
    const withoutUrl = new RegExp(
      `(\\{ code: '${code}', name: '${c.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}' \\})`,
      'g'
    );
    esLocationsHtml = esLocationsHtml.replace(
      withoutUrl,
      `{ code: '${code}', name: '${c.label}', url: '/es/country/${c.slug}/' }`
    );
  }
  fs.writeFileSync(esLocationsPath, esLocationsHtml, 'utf8');
  console.log('  ✅ es/locations.html updated');
} else {
  console.log('  ⚠️  es/locations.html not found, skipping');
}

console.log('\n✅ All done! Run:\n  node scripts/build-sitemaps.cjs\n  node scripts/build-spanish-pages.cjs\n');

// Códigos de país para el selector de teléfono del formulario de cotización.
// Colombia primero porque es el mercado principal del negocio (predeterminado
// en el selector), el resto en orden alfabético por país.
//
// `iso2` es el código ISO 3166-1 alpha-2 (minúscula), usado para pedir la
// imagen de la bandera a flagcdn.com — un emoji de bandera depende de que el
// sistema operativo tenga esos glifos (Windows no siempre los renderiza bien
// dentro de un <select>), así que usamos una imagen real en vez de confiar
// en el emoji.
export interface CountryCode {
  code: string;
  country: string;
  iso2: string;
}

export const DEFAULT_COUNTRY_CODE = '+57';

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+57',  country: 'Colombia',                iso2: 'co' },
  { code: '+54',  country: 'Argentina',                iso2: 'ar' },
  { code: '+61',  country: 'Australia',                iso2: 'au' },
  { code: '+43',  country: 'Austria',                  iso2: 'at' },
  { code: '+32',  country: 'Bélgica',                  iso2: 'be' },
  { code: '+591', country: 'Bolivia',                  iso2: 'bo' },
  { code: '+55',  country: 'Brasil',                   iso2: 'br' },
  { code: '+1',   country: 'Canadá / Estados Unidos',  iso2: 'us' },
  { code: '+56',  country: 'Chile',                    iso2: 'cl' },
  { code: '+86',  country: 'China',                    iso2: 'cn' },
  { code: '+82',  country: 'Corea del Sur',             iso2: 'kr' },
  { code: '+506', country: 'Costa Rica',                iso2: 'cr' },
  { code: '+53',  country: 'Cuba',                     iso2: 'cu' },
  { code: '+593', country: 'Ecuador',                   iso2: 'ec' },
  { code: '+503', country: 'El Salvador',                iso2: 'sv' },
  { code: '+34',  country: 'España',                   iso2: 'es' },
  { code: '+33',  country: 'Francia',                   iso2: 'fr' },
  { code: '+49',  country: 'Alemania',                  iso2: 'de' },
  { code: '+502', country: 'Guatemala',                 iso2: 'gt' },
  { code: '+504', country: 'Honduras',                  iso2: 'hn' },
  { code: '+91',  country: 'India',                    iso2: 'in' },
  { code: '+39',  country: 'Italia',                    iso2: 'it' },
  { code: '+81',  country: 'Japón',                    iso2: 'jp' },
  { code: '+52',  country: 'México',                   iso2: 'mx' },
  { code: '+505', country: 'Nicaragua',                 iso2: 'ni' },
  { code: '+507', country: 'Panamá',                    iso2: 'pa' },
  { code: '+595', country: 'Paraguay',                  iso2: 'py' },
  { code: '+51',  country: 'Perú',                     iso2: 'pe' },
  { code: '+351', country: 'Portugal',                  iso2: 'pt' },
  { code: '+44',  country: 'Reino Unido',                iso2: 'gb' },
  { code: '+7',   country: 'Rusia',                    iso2: 'ru' },
  { code: '+27',  country: 'Sudáfrica',                 iso2: 'za' },
  { code: '+598', country: 'Uruguay',                   iso2: 'uy' },
  { code: '+58',  country: 'Venezuela',                  iso2: 've' },
];

// Códigos de país para el selector de teléfono del formulario de cotización.
// Colombia primero porque es el mercado principal del negocio (predeterminado
// en el selector), el resto en orden alfabético por país.
export interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

export const DEFAULT_COUNTRY_CODE = '+57';

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+57',  country: 'Colombia',                    flag: '🇨🇴' },
  { code: '+54',  country: 'Argentina',                   flag: '🇦🇷' },
  { code: '+61',  country: 'Australia',                   flag: '🇦🇺' },
  { code: '+43',  country: 'Austria',                     flag: '🇦🇹' },
  { code: '+32',  country: 'Bélgica',                     flag: '🇧🇪' },
  { code: '+591', country: 'Bolivia',                     flag: '🇧🇴' },
  { code: '+55',  country: 'Brasil',                      flag: '🇧🇷' },
  { code: '+1',   country: 'Canadá / Estados Unidos',     flag: '🇺🇸' },
  { code: '+56',  country: 'Chile',                       flag: '🇨🇱' },
  { code: '+86',  country: 'China',                       flag: '🇨🇳' },
  { code: '+82',  country: 'Corea del Sur',                flag: '🇰🇷' },
  { code: '+506', country: 'Costa Rica',                  flag: '🇨🇷' },
  { code: '+53',  country: 'Cuba',                        flag: '🇨🇺' },
  { code: '+593', country: 'Ecuador',                     flag: '🇪🇨' },
  { code: '+503', country: 'El Salvador',                 flag: '🇸🇻' },
  { code: '+34',  country: 'España',                      flag: '🇪🇸' },
  { code: '+33',  country: 'Francia',                     flag: '🇫🇷' },
  { code: '+49',  country: 'Alemania',                    flag: '🇩🇪' },
  { code: '+502', country: 'Guatemala',                   flag: '🇬🇹' },
  { code: '+504', country: 'Honduras',                    flag: '🇭🇳' },
  { code: '+91',  country: 'India',                       flag: '🇮🇳' },
  { code: '+39',  country: 'Italia',                      flag: '🇮🇹' },
  { code: '+81',  country: 'Japón',                       flag: '🇯🇵' },
  { code: '+52',  country: 'México',                      flag: '🇲🇽' },
  { code: '+505', country: 'Nicaragua',                   flag: '🇳🇮' },
  { code: '+507', country: 'Panamá',                      flag: '🇵🇦' },
  { code: '+595', country: 'Paraguay',                    flag: '🇵🇾' },
  { code: '+51',  country: 'Perú',                        flag: '🇵🇪' },
  { code: '+351', country: 'Portugal',                    flag: '🇵🇹' },
  { code: '+44',  country: 'Reino Unido',                 flag: '🇬🇧' },
  { code: '+7',   country: 'Rusia',                       flag: '🇷🇺' },
  { code: '+27',  country: 'Sudáfrica',                   flag: '🇿🇦' },
  { code: '+598', country: 'Uruguay',                     flag: '🇺🇾' },
  { code: '+58',  country: 'Venezuela',                   flag: '🇻🇪' },
];

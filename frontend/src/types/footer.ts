export const FOOTER_SETTINGS_ID = 'footer';

export interface FooterData {
  tagline: string;
  direccion: string;
  email: string;
  copyright: string;
  tiktokUrl: string;
  facebookUrl: string;
  whatsappUrl: string;
}

// Compartido entre Footer.tsx (que los edita) y Navbar.tsx (que solo los lee),
// para que los links de redes sociales queden sincronizados en todo el sitio.
export const FOOTER_DEFAULTS: FooterData = {
  tagline: 'Materializamos tus ideas con precisión. Alta calidad en cada capa.',
  direccion: 'Colombia, Samacá',
  email: 'contacto@impresiones3d.com',
  copyright: 'RepliCars3D. Todos los derechos reservados.',
  tiktokUrl: 'https://www.tiktok.com/@3dprints881',
  facebookUrl: 'https://facebook.com/3DPrints',
  whatsappUrl: 'https://wa.me/573212805755',
};

export const FOOTER_FIELD_LABELS: Record<keyof FooterData, string> = {
  tagline: 'Frase (tagline)',
  direccion: 'Dirección',
  email: 'Correo de contacto',
  copyright: 'Texto de copyright',
  tiktokUrl: 'Link de TikTok',
  facebookUrl: 'Link de Facebook',
  whatsappUrl: 'Link de WhatsApp',
};

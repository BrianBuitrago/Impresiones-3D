/**
 * Next.js config: agregar cabeceras para evitar bloqueo por COOP en popups
 * Ajusta `Cross-Origin-Opener-Policy` a `same-origin-allow-popups` para permitir
 * que ventanas/popup puedan usar `window.close()` sin ser bloqueadas.
 */
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

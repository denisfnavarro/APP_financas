import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança aplicados a todas as respostas.
 *
 * Não há CSP aqui de propósito: o Next injeta scripts inline com nonce por
 * requisição, e uma CSP mal ajustada quebra a hidratação de um jeito difícil de
 * diagnosticar. Estes cinco cobrem o essencial sem esse risco.
 */
const securityHeaders = [
  // Impede que o navegador "adivinhe" o tipo de um arquivo servido.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Bloqueia o app dentro de um iframe de terceiros (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Não vaza a URL completa (com filtros e ids) para sites externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O app não usa câmera, microfone nem geolocalização.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Só HTTPS por 2 anos. A Vercel já serve HTTPS; isto elimina o primeiro salto em HTTP.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Não anuncia a versão do Next em todas as respostas.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

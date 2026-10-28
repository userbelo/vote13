import { useState, useEffect } from 'react';
import type { Article } from '../types';
import { verifyAdminUid, type LeadRegistration } from '../services/firebaseService';
import { ADMIN_UID, db } from '../config/firebase';
import { FREEPAY_CONFIG } from '../config/freepay';
import { collection, getDocs, query, limit } from 'firebase/firestore';

interface AdminPageProps {
  articles: Article[];
  onCreateArticle: () => void;
  onEditArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  onBackToPublicSite: () => void;
}

export default function AdminPage({
  articles,
  onCreateArticle,
  onEditArticle,
  onDeleteArticle,
  onBackToPublicSite,
}: AdminPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('gov_admin_session') === 'true';
  });
  const [uidInput, setUidInput] = useState('');
  const [uidError, setUidError] = useState('');
  const [activeTab, setActiveTab] = useState<'artigos' | 'leads' | 'gateway'>('artigos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Leads from Firebase
  const [leads, setLeads] = useState<LeadRegistration[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadFilterArticle, setLeadFilterArticle] = useState('Todos');
  const [leadFilterStatus, setLeadFilterStatus] = useState('Todos');

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const q = query(collection(db, 'solicitacoes'), limit(100));
      const snap = await getDocs(q);
      const items: LeadRegistration[] = [];
      snap.forEach(d => {
        items.push({ protocol: d.id, ...(d.data() as Omit<LeadRegistration, 'protocol'>) });
      });
      // Sort newest first
      items.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setLeads(items);
    } catch (err) {
      console.warn('Erro ao carregar leads do Firestore:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
    }
  }, [isAuthenticated, activeTab]);

  const paidLeads = leads.filter(l => l.status === 'PAGO' || l.status === 'PAID');
  const totalRevenue = paidLeads.reduce((acc, l) => acc + (l.valorTaxa || l.payment?.amount || 0), 0);

  const uniqueArticlesInLeads = Array.from(
    new Set(leads.map(l => l.artigoOrigemTitulo || 'Portal Geral - Notícias Oficiais'))
  );

  const filteredLeads = leads.filter(l => {
    const term = leadSearch.toLowerCase().trim();
    const matchSearch =
      !term ||
      l.nome.toLowerCase().includes(term) ||
      l.cpf.includes(term) ||
      l.protocol.toLowerCase().includes(term) ||
      (l.artigoOrigemTitulo && l.artigoOrigemTitulo.toLowerCase().includes(term));

    const origin = l.artigoOrigemTitulo || 'Portal Geral - Notícias Oficiais';
    const matchArticle = leadFilterArticle === 'Todos' || origin === leadFilterArticle;

    const isPaid = l.status === 'PAGO' || l.status === 'PAID';
    const matchStatus =
      leadFilterStatus === 'Todos' ||
      (leadFilterStatus === 'PAGO' && isPaid) ||
      (leadFilterStatus === 'PENDENTE' && !isPaid);

    return matchSearch && matchArticle && matchStatus;
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminUid(uidInput)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('gov_admin_session', 'true');
      setUidError('');
    } else {
      setUidError('UID de administrador não reconhecido. Verifique as credenciais no arquivo .env.local.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('gov_admin_session');
    setUidInput('');
  };

  // ── SCREEN 1: LOGIN SECRETO COM UID ──
  if (!isAuthenticated) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-coat-emblem">🏛️</div>
            <span className="admin-eyebrow">ACESSO RESTRITO GOVERNAMENTAL</span>
            <h1 className="admin-title">Painel de Gestão & Administração</h1>
            <p className="admin-subtitle">
              Ambiente protegido para gestão editorial de comunicados, artigos e monitoramento de solicitações no banco de dados.
            </p>
          </div>

          <form onSubmit={handleLogin} className="admin-form">
            <div className="admin-input-group">
              <label htmlFor="admin-uid" className="admin-label">
                UID do Administrador (DATA CENTER):
              </label>
              <div className="admin-input-wrapper">
                <span className="admin-input-icon">🔑</span>
                <input
                  id="admin-uid"
                  type="text"
                  value={uidInput}
                  onChange={e => {
                    setUidInput(e.target.value);
                    setUidError('');
                  }}
                  placeholder="Informe o seu UID de Administrador"
                  className="admin-text-input"
                  autoFocus
                  required
                />
              </div>
              {uidError && <span className="admin-error-text">{uidError}</span>}
            </div>

            <div className="admin-actions-row">
              <button
                type="button"
                className="admin-helper-link"
                onClick={() => setUidInput(ADMIN_UID)}
              >
                Bem Vindo Chefe ao seu Painel
              </button>

              <button type="submit" className="admin-btn-login">
                Entrar no Painel ➔
              </button>
            </div>
          </form>

          <div className="admin-login-footer">
            <button
              type="button"
              className="admin-btn-back-portal"
              onClick={onBackToPublicSite}
            >
              ← Voltar ao Portal Público do Cidadão
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Categories for filter
  const categories = ['Todas', ...Array.from(new Set(articles.map(a => a.category)))];

  const filteredArticles = articles.filter(art => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todas' || art.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // ── SCREEN 2: PAINEL ADMINISTRATIVO AUTENTICADO ──
  return (
    <div className="admin-dashboard-wrapper">
      {/* Top Navbar */}
      <header className="admin-navbar">
        <div className="admin-nav-left">
          <span className="admin-brand-icon">🏛️</span>
          <div>
            <span className="admin-nav-brand">Painel Administrativo do Governo Federal</span>
            <span className="admin-nav-sub">Gestão de Artigos, Banco de Dados & Gateway</span>
          </div>
        </div>

        <div className="admin-nav-right">
          <div className="admin-user-pill">
            <span className="user-dot"></span>
            <span className="user-uid-label">UID: {ADMIN_UID.slice(0, 10)}...</span>
          </div>
          <button
            type="button"
            className="admin-btn-site"
            onClick={onBackToPublicSite}
            title="Ir para a página principal institucional"
          >
            🌐 Ver Portal Público
          </button>
          <button
            type="button"
            className="admin-btn-logout"
            onClick={handleLogout}
            title="Encerrar sessão de administrador"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="admin-main container">
        {/* Metric Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="stat-label">Artigos no Portal</span>
            <div className="stat-number-row">
              <span className="stat-number">{articles.length}</span>
              <span className="stat-badge green">Sincronizado Firestore</span>
            </div>
            <span className="stat-sub">Notícias oficiais ativas</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-label">Inscrições (Leads)</span>
            <div className="stat-number-row">
              <span className="stat-number">{leads.length}</span>
              <span className="stat-badge blue">{paidLeads.length} Pagos Pix</span>
            </div>
            <span className="stat-sub">Coletados na coleção 'solicitacoes'</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-label">Faturamento Total Pix</span>
            <div className="stat-number-row">
              <span className="stat-number" style={{ color: '#16a34a' }}>
                R$ {totalRevenue.toFixed(2).replace('.', ',')}
              </span>
              <span className="stat-badge green">Recebido</span>
            </div>
            <span className="stat-sub">Compensado via FreePay Brasil</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-label">Gateway FreePay Brasil</span>
            <div className="stat-number-row">
              <span className="stat-number" style={{ fontSize: '20px' }}>Ativo</span>
              <span className="stat-badge green">API Conectada</span>
            </div>
            <span className="stat-sub">Preço dinâmico configurado por artigo</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="admin-tabs-nav">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'artigos' ? 'active' : ''}`}
            onClick={() => setActiveTab('artigos')}
          >
            📰 Artigos & Notícias ({articles.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            👥 Solicitações de Benefício ({leads.length > 0 ? leads.length : 'Firebase'})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'gateway' ? 'active' : ''}`}
            onClick={() => setActiveTab('gateway')}
          >
            💳 Gateway FreePay & Chaves
          </button>
        </div>

        {/* TAB 1: GESTÃO DE ARTIGOS */}
        {activeTab === 'artigos' && (
          <div className="admin-panel-card">
            <div className="panel-toolbar">
              <div className="panel-filters-left">
                <input
                  type="text"
                  placeholder="Buscar artigos por título ou assunto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="panel-search-input"
                />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="panel-select"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="panel-btn-create"
                onClick={onCreateArticle}
              >
                + Criar Novo Artigo
              </button>
            </div>

            <div className="panel-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Imagem</th>
                    <th>Título da Matéria</th>
                    <th>Categoria</th>
                    <th>Preço Pix</th>
                    <th>Data</th>
                    <th>Destaque</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map(art => (
                    <tr key={art.id}>
                      <td style={{ width: '80px' }}>
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="table-thumb"
                          onError={e => {
                            e.currentTarget.src = '/article-hero.jpg';
                          }}
                        />
                      </td>
                      <td>
                        <strong className="table-art-title">{art.title}</strong>
                        <span className="table-art-sub">{art.subtitle.slice(0, 80)}...</span>
                      </td>
                      <td>
                        <span className="table-badge-cat">{art.category}</span>
                      </td>
                      <td>
                        <span className="table-badge-price">
                          R$ {(art.price ?? 15.00).toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {art.date}
                      </td>
                      <td>
                        {art.featured ? (
                          <span className="table-badge-featured">★ Principal</span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Padrão</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-row">
                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={() => onEditArticle(art)}
                          >
                            Editar
                          </button>

                          {confirmDeleteId === art.id ? (
                            <div className="confirm-delete-box">
                              <span style={{ fontSize: '11px', color: '#dc2626' }}>Excluir?</span>
                              <button
                                type="button"
                                className="btn-confirm-yes"
                                onClick={() => {
                                  onDeleteArticle(art.id);
                                  setConfirmDeleteId(null);
                                }}
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                className="btn-confirm-no"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn-action-delete"
                              onClick={() => setConfirmDeleteId(art.id)}
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SOLICITAÇÕES / LEADS (FIREBASE FIRESTORE) */}
        {activeTab === 'leads' && (
          <div className="admin-panel-card">
            <div className="panel-toolbar">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                  Solicitações e Inscrições no Banco de Dados
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Registros coletados no formulário oficial e salvos na coleção 'solicitacoes'
                </span>
              </div>
              <button
                type="button"
                className="panel-btn-refresh"
                onClick={fetchLeads}
                disabled={loadingLeads}
              >
                {loadingLeads ? 'Atualizando...' : '🔄 Atualizar Dados'}
              </button>
            </div>

            {/* Quick Metrics Bar for Leads */}
            <div className="leads-metrics-strip">
              <div className="leads-metric-item">
                <span className="lm-label">Cadastros Coletados</span>
                <strong className="lm-val">{leads.length}</strong>
              </div>
              <div className="leads-metric-item">
                <span className="lm-label">Pagamentos Pix Aprovados</span>
                <strong className="lm-val text-green">{paidLeads.length}</strong>
              </div>
              <div className="leads-metric-item">
                <span className="lm-label">Faturamento Total Recebido</span>
                <strong className="lm-val text-green">R$ {totalRevenue.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div className="leads-metric-item">
                <span className="lm-label">Taxa de Conversão</span>
                <strong className="lm-val">
                  {leads.length > 0 ? `${Math.round((paidLeads.length / leads.length) * 100)}%` : '0%'}
                </strong>
              </div>
            </div>

            {/* Leads Filters Toolbar */}
            <div className="leads-filters-bar">
              <div className="leads-search-wrap">
                <input
                  type="text"
                  className="panel-search-input"
                  placeholder="Buscar por nome, CPF, protocolo ou artigo..."
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                />
              </div>

              <div className="leads-select-group">
                <select
                  className="panel-select"
                  value={leadFilterArticle}
                  onChange={e => setLeadFilterArticle(e.target.value)}
                  title="Filtrar por Artigo de Origem"
                >
                  <option value="Todos">Todos os Artigos de Origem ({uniqueArticlesInLeads.length})</option>
                  {uniqueArticlesInLeads.map(origin => (
                    <option key={origin} value={origin}>
                      {origin.length > 40 ? origin.slice(0, 40) + '...' : origin}
                    </option>
                  ))}
                </select>

                <select
                  className="panel-select"
                  value={leadFilterStatus}
                  onChange={e => setLeadFilterStatus(e.target.value)}
                  title="Filtrar por Status"
                >
                  <option value="Todos">Todos os Status</option>
                  <option value="PAGO">Somente Pagos Pix ({paidLeads.length})</option>
                  <option value="PENDENTE">Aguardando Pagamento ({leads.length - paidLeads.length})</option>
                </select>
              </div>
            </div>

            {loadingLeads ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                Carregando solicitações do Firebase Firestore...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <p>Nenhuma solicitação encontrada com os filtros selecionados.</p>
                <span style={{ fontSize: '12px' }}>
                  {leads.length === 0
                    ? 'Assim que os cidadãos preencherem o formulário no portal público, as informações aparecerão aqui em tempo real.'
                    : 'Tente alterar os termos da busca ou os filtros de artigo e status.'}
                </span>
              </div>
            ) : (
              <div className="panel-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Protocolo</th>
                      <th>Cidadão & Contato</th>
                      <th>Artigo de Origem (Lead)</th>
                      <th>Valor (R$)</th>
                      <th>Status Pix</th>
                      <th>Transação FreePay</th>
                      <th>Data / Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => {
                      const isPaid = lead.status === 'PAGO' || lead.status === 'PAID';
                      const leadPrice = typeof lead.valorTaxa === 'number' && lead.valorTaxa > 0
                        ? lead.valorTaxa
                        : (lead.payment?.amount || 15.00);

                      return (
                        <tr key={lead.protocol}>
                          <td>
                            <span className="lead-protocol">{lead.protocol}</span>
                          </td>
                          <td>
                            <strong className="lead-name-text">{lead.nome}</strong>
                            <div className="lead-meta-inline">
                              <span style={{ fontFamily: 'monospace' }}>CPF: {lead.cpf}</span>
                              <span className="sep">•</span>
                              <span>{lead.phone}</span>
                              <span className="sep">•</span>
                              <span className="table-badge-cat">{lead.estado}</span>
                            </div>
                          </td>
                          <td>
                            <div className="lead-origin-tag" title={lead.artigoOrigemTitulo || 'Portal Geral'}>
                              <span className="origin-icon">📰</span>
                              <span className="origin-text">
                                {lead.artigoOrigemTitulo
                                  ? (lead.artigoOrigemTitulo.length > 42 ? lead.artigoOrigemTitulo.slice(0, 42) + '...' : lead.artigoOrigemTitulo)
                                  : 'Portal Geral — Notícias Oficiais'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`lead-price-badge ${isPaid ? 'paid' : ''}`}>
                              R$ {leadPrice.toFixed(2).replace('.', ',')}
                            </span>
                          </td>
                          <td>
                            {isPaid ? (
                              <span className="lead-status-badge status-paid">
                                ✓ PAGO PIX
                              </span>
                            ) : (
                              <span className="lead-status-badge status-pending">
                                ⏳ AGUARDANDO
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                            {lead.payment?.transactionId ? (
                              <span title={lead.payment.transactionId}>
                                {lead.payment.transactionId.slice(0, 12)}...
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>Não gerada</span>
                            )}
                          </td>
                          <td style={{ fontSize: '11.5px', color: '#64748b' }}>
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GATEWAY FREEPAY */}
        {activeTab === 'gateway' && (
          <div className="admin-panel-card">
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#0f172a' }}>
              Integração FreePay Brasil
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#475569' }}>
              Parâmetros de autenticação e credenciais ativas no arquivo .env.local:
            </p>

            <div className="gateway-creds-grid">
              <div className="gateway-box">
                <span className="g-label">Company ID:</span>
                <code className="g-val">{FREEPAY_CONFIG.companyId}</code>
              </div>
              <div className="gateway-box">
                <span className="g-label">Public Key:</span>
                <code className="g-val">{FREEPAY_CONFIG.publicKey}</code>
              </div>
              <div className="gateway-box">
                <span className="g-label">Secret Key:</span>
                <code className="g-val">{FREEPAY_CONFIG.secretKey.slice(0, 12)}... (oculta)</code>
              </div>
              <div className="gateway-box">
                <span className="g-label">URL da API:</span>
                <code className="g-val">{FREEPAY_CONFIG.directUrl}</code>
              </div>
              <div className="gateway-box">
                <span className="g-label">Valor Cobrado:</span>
                <strong className="g-val" style={{ color: '#16a34a' }}>R$ 15,00 (1500 centavos)</strong>
              </div>
              <div className="gateway-box">
                <span className="g-label">Método de Pagamento:</span>
                <strong className="g-val">PIX (Instantâneo)</strong>
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#1e293b' }}>
                Como acessar esta página secreta:
              </strong>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                Esta página administrativa não possui links visíveis no portal público. Para acessá-la diretamente, basta digitar <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>#admin</code> no final da URL do site (ex: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>http://localhost:5173/#admin</code>) e informar o UID de administrador.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

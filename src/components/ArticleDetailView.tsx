import { useState } from 'react'
import type { Article } from '../types'


interface ArticleDetailViewProps {
  article: Article
  allArticles: Article[]
  onBack: () => void
  onSelectArticle: (article: Article) => void
  onOpenEligibilityModal: () => void
  vagas: number
  countdownInline: string
}

export default function ArticleDetailView({
  article,
  allArticles,
  onBack,
  onSelectArticle,
  onOpenEligibilityModal,
  vagas,
  countdownInline,
}: ArticleDetailViewProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const relatedArticles = allArticles
    .filter(a => a.id !== article.id)
    .slice(0, 3)

  return (
    <article className="article-reader-wrapper">
      {/* Breadcrumb & Back Navigation */}
      <div className="article-reader-toolbar">
        <div className="container toolbar-inner">
          <button
            type="button"
            className="btn-back"
            onClick={onBack}
            aria-label="Voltar para a página inicial com todas as notícias"
          >
            ← Voltar para a página principal
          </button>
          <nav className="reader-breadcrumbs" aria-label="Navegação estrutural">
            <span onClick={onBack} className="crumb-link">Início</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-category">{article.category}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{article.title.slice(0, 42)}...</span>
          </nav>
        </div>
      </div>

      <div className="container reader-main-layout">
        <div className="reader-content-column">
          {/* Article Header */}
          <header className="reader-header">
            {article.highlightBadge && (
              <span className="reader-kicker-tag">{article.highlightBadge}</span>
            )}
            <span className="reader-category-label">{article.category}</span>
            <h1 className="reader-h1">{article.title}</h1>
            <p className="reader-lead">{article.subtitle}</p>

            <div className="reader-meta-bar">
              <div className="reader-meta-info">
                <span className="meta-author">Por <strong>{article.author}</strong></span>
                <span className="meta-sep">•</span>
                <span className="meta-date">Publicado em {article.date}</span>
                {article.updatedTime && (
                  <>
                    <span className="meta-sep">•</span>
                    <span className="meta-updated">{article.updatedTime}</span>
                  </>
                )}
                <span className="meta-sep">•</span>
                <span className="meta-readtime">{article.readTime}</span>
              </div>

              <div className="reader-actions">
                <button
                  type="button"
                  className="reader-action-btn"
                  onClick={handleShare}
                  title="Copiar link desta matéria"
                >
                  {copied ? 'Link copiado!' : 'Compartilhar'}
                </button>
                <button
                  type="button"
                  className="reader-action-btn"
                  onClick={() => window.print()}
                  title="Imprimir notícia oficial"
                >
                  Imprimir
                </button>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          <figure className="reader-figure">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="reader-img"
              loading="eager"
            />
            {article.imageCaption && (
              <figcaption className="reader-caption">{article.imageCaption}</figcaption>
            )}
          </figure>

          {/* Body Content */}
          <div className="reader-body">
            {article.content.map((paragraph, index) => {
              // Add a quote or highlight box dynamically after second paragraph for high retention
              if (index === 1) {
                return (
                  <div key={index}>
                    <p className="reader-paragraph">{paragraph}</p>
                    <div className="reader-pullquote">
                      <p className="pullquote-text">
                        "O acesso a informações oficiais transparentes é um direito fundamental de todas as famílias brasileiras em situação de vulnerabilidade."
                      </p>
                      <span className="pullquote-author">— Diretriz Oficial do MDS</span>
                    </div>
                  </div>
                )
              }
              return (
                <p key={index} className="reader-paragraph">
                  {paragraph}
                </p>
              )
            })}
          </div>

          {/* Strategic Contextual Funnel Box at end of article */}
          <section className="reader-cta-card" aria-labelledby="reader-cta-heading">
            <div className="reader-cta-accent" />
            <span className="reader-cta-badge">CANAL OFICIAL DE CONSULTA</span>
            <h2 id="reader-cta-heading" className="reader-cta-title">
              Verifique se você tem direito aos benefícios informados
            </h2>
            <p className="reader-cta-desc">
              O sistema de pré-cadastro nacional está aberto para consulta de elegibilidade. O procedimento é digital, gratuito e leva menos de 2 minutos.
            </p>
            <div className="reader-cta-meta">
              <span>Prazo para o ciclo: <strong>{countdownInline}</strong></span>
              <span className="meta-sep">|</span>
              <span><strong>{vagas}</strong> vagas disponíveis</span>
            </div>
            <button
              type="button"
              className="reader-cta-btn"
              onClick={onOpenEligibilityModal}
            >
              Verificar minha elegibilidade agora
            </button>
            <p className="reader-cta-disclaimer">
              Dados protegidos pela LGPD (Lei nº 13.709/2018). Verificação integrada com o CadÚnico federal.
            </p>
          </section>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="reader-related-section" aria-labelledby="related-heading">
              <h3 id="related-heading" className="related-section-title">
                Notícias e Comunicados Relacionados
              </h3>
              <div className="related-cards-grid">
                {relatedArticles.map(rel => (
                  <div
                    key={rel.id}
                    className="related-card"
                    onClick={() => {
                      onSelectArticle(rel)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onSelectArticle(rel)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                    }}
                  >
                    <div className="related-card-img-wrap">
                      <img src={rel.imageUrl} alt={rel.title} />
                      <span className="related-card-cat">{rel.category}</span>
                    </div>
                    <div className="related-card-content">
                      <h4 className="related-card-title">{rel.title}</h4>
                      <p className="related-card-date">{rel.date}</p>
                      <span className="related-card-link">Ler notícia completa →</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  )
}

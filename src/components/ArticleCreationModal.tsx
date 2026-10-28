import { useState, useEffect } from 'react'
import type { Article } from '../types'

interface ArticleCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (article: Article) => void
  editingArticle?: Article | null
}

const PRESET_IMAGES = [
  {
    label: 'Reunião e Acordo Internacional',
    url: '/article-hero.jpg',
    defaultCaption: 'Reunião bilateral e acordos governamentais. Foto: Agência Brasil / Divulgação.',
  },
  {
    label: 'Família Beneficiária',
    url: '/family-hero.jpg',
    defaultCaption: 'Famílias relatam impacto positivo dos programas sociais. Foto: MDS / Divulgação.',
  },
  {
    label: 'Cartão Bolsa Família / CadÚnico',
    url: '/cadunico-card.jpg',
    defaultCaption: 'Cartão de benefícios do programa social. Foto: MDS / Divulgação.',
  },
  {
    label: 'Atendimento CRAS / Presencial',
    url: '/atendimento-social.jpg',
    defaultCaption: 'Atendimento e orientação a beneficiários em posto oficial. Foto: MDS / Divulgação.',
  },
]

const CATEGORIES = [
  'Bolsa Família',
  'CadÚnico',
  'Guias & Cidadania',
  'Calendário & Pagamento',
  'Direitos & Legislação',
  'Comunicados Oficiais',
]

export default function ArticleCreationModal({
  isOpen,
  onClose,
  onSave,
  editingArticle,
}: ArticleCreationModalProps) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [author, setAuthor] = useState('Ministério do Desenvolvimento e Assistência Social (MDS)')
  const [readTime, setReadTime] = useState('3 min de leitura')
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0)
  const [customImageUrl, setCustomImageUrl] = useState('')
  const [imageCaption, setImageCaption] = useState(PRESET_IMAGES[0].defaultCaption)
  const [content, setContent] = useState('')
  const [featured, setFeatured] = useState(false)
  const [highlightBadge, setHighlightBadge] = useState('COMUNICADO OFICIAL')
  const [price, setPrice] = useState('15.00')
  const [errorMsg, setErrorMsg] = useState('')

  // Pre-fill fields when editing an existing article
  useEffect(() => {
    if (editingArticle) {
      setTitle(editingArticle.title)
      setSubtitle(editingArticle.subtitle)
      setCategory(editingArticle.category)
      setAuthor(editingArticle.author)
      setReadTime(editingArticle.readTime)
      setImageCaption(editingArticle.imageCaption || '')
      setContent(editingArticle.content.join('\n\n'))
      setFeatured(!!editingArticle.featured)
      setHighlightBadge(editingArticle.highlightBadge || 'OFICIAL')
      setPrice(editingArticle.price !== undefined ? String(editingArticle.price) : '15.00')

      // Check if image matches preset
      const presetIdx = PRESET_IMAGES.findIndex(p => p.url === editingArticle.imageUrl)
      if (presetIdx >= 0) {
        setSelectedPresetIndex(presetIdx)
        setCustomImageUrl('')
      } else {
        setSelectedPresetIndex(-1)
        setCustomImageUrl(editingArticle.imageUrl)
      }
    } else {
      // Reset form for fresh create
      setTitle('')
      setSubtitle('')
      setCategory(CATEGORIES[0])
      setAuthor('Ministério do Desenvolvimento e Assistência Social (MDS)')
      setReadTime('3 min de leitura')
      setSelectedPresetIndex(0)
      setCustomImageUrl('')
      setImageCaption(PRESET_IMAGES[0].defaultCaption)
      setContent('')
      setFeatured(false)
      setHighlightBadge('COMUNICADO OFICIAL')
      setPrice('15.00')
    }
    setErrorMsg('')
  }, [editingArticle, isOpen])

  if (!isOpen) return null

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx)
    setImageCaption(PRESET_IMAGES[idx].defaultCaption)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMsg('Por favor, informe a manchete/título do artigo.')
      return
    }
    if (!subtitle.trim()) {
      setErrorMsg('Por favor, informe o subtítulo ou resumo da matéria.')
      return
    }
    if (!content.trim()) {
      setErrorMsg('Por favor, escreva o texto do artigo.')
      return
    }

    const parsedPrice = parseFloat(price.replace(',', '.'))
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Por favor, informe um valor de taxa Pix válido maior que zero (ex: 15.00).')
      return
    }

    const finalImage = customImageUrl.trim()
      ? customImageUrl.trim()
      : (selectedPresetIndex >= 0 ? PRESET_IMAGES[selectedPresetIndex].url : PRESET_IMAGES[0].url)

    // Split paragraphs by linebreaks
    const paragraphs = content
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    const articleData: Article = {
      id: editingArticle ? editingArticle.id : `art-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      category,
      date: editingArticle ? editingArticle.date : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
      updatedTime: editingArticle ? 'Atualizado recentemente' : 'Publicado agora',
      author: author.trim() || 'Ministério do Desenvolvimento Social',
      readTime: readTime.trim() || '3 min de leitura',
      imageUrl: finalImage,
      imageCaption: imageCaption.trim() || 'Foto: Agência Brasil / Divulgação.',
      content: paragraphs.length > 0 ? paragraphs : [content.trim()],
      featured,
      highlightBadge: highlightBadge.trim() || undefined,
      views: editingArticle?.views ?? 1,
      price: parsedPrice,
    }

    onSave(articleData)
    onClose()
  }

  const isEditing = !!editingArticle

  return (
    <div className="article-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-article-title">
      <div className="article-modal-container">
        {/* Header */}
        <div className="article-modal-header">
          <div>
            <span className="article-modal-eyebrow">ÁREA EDITORIAL / PORTAL GOV.BR</span>
            <h2 id="modal-article-title" className="article-modal-title">
              {isEditing ? 'Editar Artigo Publicado' : 'Publicar Novo Artigo Oficial'}
            </h2>
          </div>
          <button
            type="button"
            className="article-modal-close"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="article-modal-form">
          {errorMsg && (
            <div className="article-form-error" role="alert">
              {errorMsg}
            </div>
          )}

          <div className="form-row">
            <div className="form-group form-group--flex2">
              <label htmlFor="art-title">Título / Manchete Principal *</label>
              <input
                id="art-title"
                type="text"
                className="gov-input"
                placeholder="Ex: Novo calendário do Bolsa Família estabelece antecipação de parcelas"
                value={title}
                onChange={e => {
                  setTitle(e.target.value)
                  setErrorMsg('')
                }}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="art-category">Categoria *</label>
              <select
                id="art-category"
                className="gov-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ maxWidth: '180px' }}>
              <label htmlFor="art-price" title="Valor cobrado na taxa Pix deste artigo">
                Preço / Taxa Pix (R$) *
              </label>
              <div className="price-input-wrapper">
                <span className="price-currency-prefix">R$</span>
                <input
                  id="art-price"
                  type="text"
                  className="gov-input price-input-field"
                  placeholder="15,00"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="art-subtitle">Subtítulo / Lead Explicativo *</label>
            <input
              id="art-subtitle"
              type="text"
              className="gov-input"
              placeholder="Resumo de alto impacto que explica a matéria em uma ou duas frases"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="art-author">Órgão Emissor / Autor</label>
              <input
                id="art-author"
                type="text"
                className="gov-input"
                placeholder="Ex: Ministério do Desenvolvimento e Assistência Social"
                value={author}
                onChange={e => setAuthor(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="art-readtime">Tempo Estimado de Leitura</label>
              <input
                id="art-readtime"
                type="text"
                className="gov-input"
                placeholder="Ex: 4 min de leitura"
                value={readTime}
                onChange={e => setReadTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="art-badge">Etiqueta de Destaque</label>
              <input
                id="art-badge"
                type="text"
                className="gov-input"
                placeholder="Ex: OFICIAL, URGENTE, GUIA"
                value={highlightBadge}
                onChange={e => setHighlightBadge(e.target.value)}
              />
            </div>
          </div>

          {/* Image selection */}
          <div className="form-group">
            <label>Selecione a Imagem de Capa</label>
            <div className="preset-images-grid">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  type="button"
                  key={preset.url}
                  className={`preset-image-card ${selectedPresetIndex === idx && !customImageUrl ? 'is-selected' : ''}`}
                  onClick={() => {
                    setCustomImageUrl('')
                    handleSelectPreset(idx)
                  }}
                >
                  <img src={preset.url} alt={preset.label} />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            <div className="custom-image-row">
              <label htmlFor="art-custom-img" className="custom-image-label">Ou informe o link de imagem externa (opcional):</label>
              <input
                id="art-custom-img"
                type="url"
                className="gov-input"
                placeholder="https://exemplo.com/imagem.jpg"
                value={customImageUrl}
                onChange={e => {
                  setCustomImageUrl(e.target.value)
                  if (e.target.value) setSelectedPresetIndex(-1)
                }}
              />
            </div>

            <div className="caption-input-row">
              <label htmlFor="art-caption">Legenda Oficial da Foto</label>
              <input
                id="art-caption"
                type="text"
                className="gov-input"
                placeholder="Ex: Atendimento realizado no posto de cadastramento. Foto: MDS / Divulgação."
                value={imageCaption}
                onChange={e => setImageCaption(e.target.value)}
              />
            </div>
          </div>

          {/* Article Body */}
          <div className="form-group">
            <label htmlFor="art-content">Conteúdo da Notícia (separe os parágrafos com quebra de linha) *</label>
            <textarea
              id="art-content"
              rows={7}
              className="gov-textarea"
              placeholder="Escreva aqui a íntegra da notícia institucional. Use linguagem formal, clara e objetiva para manter a credibilidade oficial do portal."
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
          </div>

          {/* Featured checkbox */}
          <div className="form-checkbox-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={featured}
                onChange={e => setFeatured(e.target.checked)}
              />
              <span className="checkbox-text">
                <strong>Destacar como Manchete Principal de Capa</strong> — esta matéria ocupará o espaço principal no topo do portal.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="article-modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-publish"
            >
              {isEditing ? 'Salvar Alterações no Artigo' : 'Publicar Artigo no Portal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

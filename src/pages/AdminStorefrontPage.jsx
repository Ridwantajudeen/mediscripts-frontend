import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { getFriendlyErrorMessage } from '../lib/errorMessages'
import './AdminDashboardPage.css'
import './AdminStorefrontPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const sectionLabels = {
  featured: 'Featured products',
  promotion: 'Promotion products',
}

function formatCurrency(value) {
  return `NGN ${Number(value || 0).toLocaleString()}`
}

function normalizeProduct(product) {
  return {
    ...product,
    categoryName: product.categories?.name || 'Uncategorized',
    images: Array.isArray(product.images) ? product.images : [],
  }
}

function AdminStorefrontPage() {
  const { isAdmin, loading, accessToken, logout } = useAuth()
  const [products, setProducts] = useState([])
  const [featuredProductIds, setFeaturedProductIds] = useState([])
  const [promotionProductIds, setPromotionProductIds] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('featured')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (loading || !isAdmin || !accessToken) {
      return undefined
    }

    let isMounted = true

    const loadStorefront = async () => {
      setPageLoading(true)
      setPageError('')

      try {
        const [productsResponse, sectionsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/admin/products`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${apiBaseUrl}/api/admin/homepage-sections`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ])

        const productsPayload = await productsResponse.json()
        const sectionsPayload = await sectionsResponse.json()

        if (!productsResponse.ok) {
          throw new Error(productsPayload.message || 'Unable to load products.')
        }

        if (!sectionsResponse.ok) {
          throw new Error(sectionsPayload.message || 'Unable to load storefront sections.')
        }

        if (isMounted) {
          setProducts((productsPayload.products || []).map(normalizeProduct))
          setFeaturedProductIds(sectionsPayload.featuredProductIds || [])
          setPromotionProductIds(sectionsPayload.promotionProductIds || [])
        }
      } catch (error) {
        if (isMounted) {
          setPageError(getFriendlyErrorMessage(error, 'We could not load the storefront right now.'))
        }
      } finally {
        if (isMounted) {
          setPageLoading(false)
        }
      }
    }

    loadStorefront()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdmin, loading])

  const selectedIds = activeSection === 'featured' ? featuredProductIds : promotionProductIds
  const otherSelectedIds = activeSection === 'featured' ? promotionProductIds : featuredProductIds

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const selectedProducts = useMemo(
    () => selectedIds.map((productId) => productMap.get(productId)).filter(Boolean),
    [productMap, selectedIds],
  )

  const availableProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return products.filter((product) => {
      if (normalizedQuery === '') {
        return true
      }

      const haystack = [
        product.name,
        product.description,
        product.categoryName,
        product.slug,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [products, searchQuery])

  const selectedSectionLabel = sectionLabels[activeSection]
  const sectionLimit = activeSection === 'featured' ? 6 : 5
  const canAddMore = selectedIds.length < sectionLimit

  const addProduct = (productId) => {
    if (selectedIds.includes(productId) || otherSelectedIds.includes(productId) || !canAddMore) {
      return
    }

    if (activeSection === 'featured') {
      setFeaturedProductIds((current) => [...current, productId])
      return
    }

    setPromotionProductIds((current) => [...current, productId])
  }

  const removeProduct = (productId) => {
    if (activeSection === 'featured') {
      setFeaturedProductIds((current) => current.filter((id) => id !== productId))
      return
    }

    setPromotionProductIds((current) => current.filter((id) => id !== productId))
  }

  const saveStorefront = async () => {
    setSaving(true)
    setActionMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/homepage-sections`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          featuredProductIds,
          promotionProductIds,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to save storefront sections.')
      }

      setFeaturedProductIds(payload.featuredProductIds || [])
      setPromotionProductIds(payload.promotionProductIds || [])
      setActionMessage('Storefront selections saved.')
    } catch (error) {
      setActionMessage(getFriendlyErrorMessage(error, 'We could not save your selections right now.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-state-card">
          <p className="admin-kicker">Admin access</p>
          <h1>Loading access...</h1>
          <p>Please wait while we verify your session.</p>
        </section>
      </main>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-hero__copy">
          <p className="admin-kicker">Storefront display</p>
          <h1>Choose the products customers see first.</h1>
          <p>
            Pick the featured items and promotion picks that should appear on the storefront.
            Leave a section empty and it stays hidden.
          </p>

          <div className="admin-hero__actions">
            <Link className="admin-button admin-button--ghost" to="/admin">
              Back to dashboard
            </Link>
            <Link className="admin-button admin-button--ghost" to="/admin/catalog">
              Open catalog
            </Link>
            <Link className="admin-button admin-button--ghost" to="/products">
              View storefront
            </Link>
          </div>
        </div>

        <button type="button" className="admin-signout" onClick={logout}>
          Sign out
        </button>
      </section>

      <section className="storefront-switcher">
        {Object.entries(sectionLabels).map(([sectionKey, label]) => (
          <button
            key={sectionKey}
            type="button"
            className={`storefront-switcher__button${
              activeSection === sectionKey ? ' is-active' : ''
            }`}
            onClick={() => setActiveSection(sectionKey)}
          >
            <span>{label}</span>
            <strong>
              {sectionKey === 'featured' ? featuredProductIds.length : promotionProductIds.length}/
              {sectionKey === 'featured' ? 6 : 5}
            </strong>
          </button>
        ))}
      </section>

      {actionMessage ? <p className="admin-success">{actionMessage}</p> : null}
      {pageError ? <p className="admin-error">{pageError}</p> : null}
      {pageLoading ? <p className="admin-helper">Loading products and current selections...</p> : null}

      <section className="storefront-grid">
        <article className="storefront-panel">
          <div className="storefront-panel__header">
            <div>
              <p className="admin-kicker">Selected section</p>
              <h2>{selectedSectionLabel}</h2>
            </div>
            <span className="storefront-panel__limit">
              {selectedIds.length}/{sectionLimit} selected
            </span>
          </div>

          {selectedProducts.length > 0 ? (
            <div className="storefront-selected-list">
              {selectedProducts.map((product, index) => (
                <article className="storefront-selected-item" key={product.id}>
                  <span className="storefront-selected-item__index">{index + 1}</span>
                  <div className="storefront-selected-item__body">
                    <strong>{product.name}</strong>
                    <p>{product.categoryName}</p>
                  </div>
                  <button
                    type="button"
                    className="storefront-selected-item__remove"
                    onClick={() => removeProduct(product.id)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="storefront-empty">
              <h3>No products selected yet</h3>
              <p>Choose a few products from the list on the right. If you leave it empty, the section will stay hidden.</p>
            </div>
          )}

          <div className="storefront-panel__actions">
            <div className="storefront-panel__actions-copy">
              <strong>Ready to publish?</strong>
              <p>Save your picks when the lineup looks right.</p>
            </div>
            <button
              type="button"
              className="admin-button storefront-panel__save-button"
              onClick={saveStorefront}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save selections'}
            </button>
          </div>
        </article>

        <article className="storefront-panel storefront-panel--light">
          <div className="storefront-panel__header">
            <div>
              <p className="admin-kicker">Available products</p>
              <h2>Choose from the catalog</h2>
            </div>
            <span className="storefront-panel__limit">{availableProducts.length} shown</span>
          </div>

          <label className="storefront-search">
            <span>Search products</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or category"
            />
          </label>

          <div className="storefront-products-grid">
            {availableProducts.map((product) => {
              const isSelected = selectedIds.includes(product.id)
              const selectedElsewhere = otherSelectedIds.includes(product.id)
              const imageSource = product.images[0] || '/product-placeholder.svg'

              return (
                <article className="storefront-product-card" key={product.id}>
                  <div className="storefront-product-card__image">
                    <img src={imageSource} alt={product.name} />
                  </div>

                  <div className="storefront-product-card__body">
                    <div className="storefront-product-card__top">
                      <span>{product.categoryName}</span>
                      <strong>{formatCurrency(product.price)}</strong>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="storefront-product-card__meta">
                      <span>{product.stock_quantity} in stock</span>
                      <span>{product.prescription_required ? 'Prescription' : 'OTC'}</span>
                    </div>
                    <button
                      type="button"
                      className="storefront-product-card__button"
                      onClick={() => addProduct(product.id)}
                      disabled={isSelected || selectedElsewhere || !canAddMore || product.is_active === false}
                    >
                      {isSelected
                        ? `Added to ${selectedSectionLabel}`
                        : selectedElsewhere
                          ? 'Used in other section'
                          : product.is_active === false
                            ? 'Inactive product'
                          : canAddMore
                            ? `Add to ${selectedSectionLabel.toLowerCase()}`
                            : 'Limit reached'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </article>
      </section>
    </main>
  )
}

export default AdminStorefrontPage

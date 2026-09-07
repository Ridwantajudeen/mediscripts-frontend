import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useParams } from 'react-router-dom'
import useCart from '../context/useCart'
import './ProductDetailPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function fetchJson(url) {
  return fetch(url).then(async (response) => {
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.message || 'Unable to load this medicine.')
    }

    return payload
  })
}

function normalizeProduct(product) {
  return {
    id: product.id,
    slug: product.slug || product.id,
    category: product.category,
    name: product.name,
    description: product.description,
    price: Number(product.price || 0),
    note: product.note || '',
    image:
      Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : product.image || '/product-placeholder.svg',
    inStock:
      typeof product.inStock === 'boolean'
        ? product.inStock
        : Number(product.stockQuantity || 0) > 0,
    prescriptionRequired: Boolean(product.prescriptionRequired),
    stockQuantity: Number(product.stockQuantity || 0),
  }
}

function DetailIcon({ name }) {
  const iconProps = {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
    className: 'product-detail__icon',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  switch (name) {
    case 'shield':
      return (
        <svg {...iconProps}>
          <path d="M12 3.5 19 6v5.4c0 4.5-3 8.3-7 9.1-4-.8-7-4.6-7-9.1V6z" />
          <path d="m8.5 12 2.3 2.3 4.9-4.9" />
        </svg>
      )
    case 'payment':
      return (
        <svg {...iconProps}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
          <path d="M3.5 10h17" />
          <path d="M8 15h4" />
        </svg>
      )
    case 'delivery':
      return (
        <svg {...iconProps}>
          <path d="M3.5 7.5h11v9h-11z" />
          <path d="M14.5 10h3l3 3v3.5h-6z" />
          <circle cx="7" cy="18" r="1.6" />
          <circle cx="17" cy="18" r="1.6" />
        </svg>
      )
    default:
      return null
  }
}

function ProductDetailPage() {
  const { productSlug } = useParams()
  const { addToCart } = useCart()

  const productQuery = useQuery({
    queryKey: ['catalog-product', productSlug],
    queryFn: () => fetchJson(`${apiBaseUrl}/api/catalog/products/${productSlug}`),
    enabled: Boolean(productSlug),
    staleTime: 5 * 60 * 1000,
  })

  const product = productQuery.data?.product ? normalizeProduct(productQuery.data.product) : null

  if (productQuery.isLoading) {
    return (
      <div className="page product-detail-page">
        <div className="product-detail__loading">Loading medicine details...</div>
      </div>
    )
  }

  if (productQuery.isError || !product) {
    return <Navigate to="/products" replace />
  }

  const handleAddToCart = () => {
    if (!product.inStock) {
      return
    }

    addToCart(product)
  }

  return (
    <div className="page product-detail-page">
      <div className="product-detail__back">
        <Link to="/products">Back to products</Link>
      </div>

      <section className="product-detail">
        <div className="product-detail__visual">
          <div className="product-detail__image-wrap">
            <img
              className="product-detail__image"
              src={product.image || '/product-placeholder.svg'}
              alt={product.name}
            />
          </div>

          <div className="product-detail__badges">
            <span className="product-detail__badge">{product.category}</span>
            {product.prescriptionRequired ? (
              <span className="product-detail__badge product-detail__badge--muted">
                Prescription required
              </span>
            ) : null}
          </div>
        </div>

        <div className="product-detail__summary">
          <p className="product-detail__eyebrow">Medicine details</p>
          <h1>{product.name}</h1>
          <p className="product-detail__description">{product.description}</p>

          <div className="product-detail__price-row">
            <strong>NGN {product.price.toLocaleString()}</strong>
            <span
              className={
                product.inStock
                  ? 'product-detail__stock'
                  : 'product-detail__stock product-detail__stock--out'
              }
            >
              {product.inStock ? 'In stock' : 'Out of stock'}
            </span>
          </div>

          <div className="product-detail__actions">
            {product.inStock ? (
              product.prescriptionRequired ? (
                <Link className="product-detail__button" to="/contact">
                  Visit our store
                </Link>
              ) : (
                <button type="button" className="product-detail__button" onClick={handleAddToCart}>
                  Add to cart
                </button>
              )
            ) : (
              <button type="button" className="product-detail__button" disabled>
                Unavailable
              </button>
            )}

            <Link className="product-detail__link" to="/products">
              Continue browsing
            </Link>
          </div>

          <div className="product-detail__panel">
            <div className="product-detail__panel-icon">
              <DetailIcon name={product.prescriptionRequired ? 'shield' : 'delivery'} />
            </div>
            <div>
              <h2>{product.prescriptionRequired ? 'Prescription required' : 'Easy ordering'}</h2>
              <p>
                {product.prescriptionRequired
                  ? 'This medicine is only available in-store. Please visit our pharmacy with your prescription so we can assist you directly.'
                  : 'You can add this medicine to your cart and continue through checkout when you are ready.'}
              </p>
            </div>
          </div>

          <div className="product-detail__facts">
            <article>
              <span className="product-detail__fact-label">Category</span>
              <strong>{product.category}</strong>
            </article>
            <article>
              <span className="product-detail__fact-label">Stock</span>
              <strong>
                {product.stockQuantity > 0 ? `${product.stockQuantity} available` : 'Currently empty'}
              </strong>
            </article>
            <article>
              <span className="product-detail__fact-label">Tracking</span>
              <strong>Private and secure</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="product-detail__support">
        <article className="product-detail__support-card">
          <span className="product-detail__support-icon">
            <DetailIcon name="shield" />
          </span>
          <h3>{product.prescriptionRequired ? 'Visit our store' : 'Safe checkout flow'}</h3>
          <p>
            {product.prescriptionRequired
              ? 'This item is handled in-store for now. Please bring your prescription to the pharmacy for assistance.'
              : 'Regular medicines move straight to payment. Prescription items are handled separately.'}
          </p>
        </article>

        <article className="product-detail__support-card">
          <span className="product-detail__support-icon">
            <DetailIcon name="payment" />
          </span>
          <h3>Simple payment</h3>
          <p>
            The experience stays calm and easy, with payment handled only when the order is ready
            to continue.
          </p>
        </article>

        <article className="product-detail__support-card">
          <span className="product-detail__support-icon">
            <DetailIcon name="delivery" />
          </span>
          <h3>Delivery updates</h3>
          <p>
            Once your order moves forward, you will be able to follow the next steps securely.
          </p>
        </article>
      </section>
    </div>
  )
}

export default ProductDetailPage

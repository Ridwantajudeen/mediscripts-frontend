import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { categories as fallbackCategoryNames } from '../data/siteContent'
import SectionHeading from '../components/ui/SectionHeading'
import ProductCard from '../components/home/ProductCard'
import './ProductsPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
const pageSize = 24

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fetchJson(url) {
  return fetch(url).then(async (response) => {
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.message || 'Unable to load catalog data.')
    }

    return payload
  })
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="catalog-search__svg"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="catalog-filter__svg"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
}

function ProductSkeletonCard() {
  return (
    <article className="product-skeleton">
      <div className="product-skeleton__image" />
      <div className="product-skeleton__content">
        <div className="product-skeleton__line product-skeleton__line--title" />
        <div className="product-skeleton__line product-skeleton__line--chip" />
        <div className="product-skeleton__line product-skeleton__line--body" />
        <div className="product-skeleton__line product-skeleton__line--body product-skeleton__line--short" />
        <div className="product-skeleton__footer">
          <div className="product-skeleton__line product-skeleton__line--price" />
          <div className="product-skeleton__button" />
        </div>
      </div>
    </article>
  )
}

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchFromUrl = searchParams.get('q') || ''
  const [query, setQuery] = useState(searchFromUrl)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [visibleCategoryIds, setVisibleCategoryIds] = useState(['all'])
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const deferredQuery = useDeferredValue(query.trim())

  useEffect(() => {
    setQuery(searchFromUrl)
  }, [searchFromUrl])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const value = query.trim()

    if (value) {
      setSearchParams({ q: value })
      return
    }

    setSearchParams({})
  }

  const categoriesQuery = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: () => fetchJson(`${apiBaseUrl}/api/catalog/categories`),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const sectionsQuery = useQuery({
    queryKey: ['catalog-homepage-sections'],
    queryFn: () => fetchJson(`${apiBaseUrl}/api/catalog/homepage-sections`),
    staleTime: 5 * 60 * 1000,
  })

  const categoryOptions = useMemo(() => {
    const liveCategories = Array.isArray(categoriesQuery.data?.categories)
      ? categoriesQuery.data.categories
      : []

    if (liveCategories.length > 0) {
      return [
        { id: 'all', name: 'All' },
        ...liveCategories.map((category) => ({
          id: category.id,
          name: category.name,
        })),
      ]
    }

    return [
      { id: 'all', name: 'All' },
      ...fallbackCategoryNames.map((name) => ({
        id: slugify(name),
        name,
      })),
    ]
  }, [categoriesQuery.data])

  const defaultVisibleCategoryIds = useMemo(
    () => categoryOptions.slice(0, 5).map((category) => category.id),
    [categoryOptions],
  )

  useEffect(() => {
    setVisibleCategoryIds(defaultVisibleCategoryIds)
  }, [defaultVisibleCategoryIds])

  const visibleCategories = useMemo(() => {
    const categoryMap = new Map(categoryOptions.map((category) => [category.id, category]))
    return visibleCategoryIds.map((id) => categoryMap.get(id)).filter(Boolean)
  }, [categoryOptions, visibleCategoryIds])

  const hiddenCategories = useMemo(() => {
    const visibleIds = new Set(visibleCategoryIds)
    return categoryOptions.filter((category) => !visibleIds.has(category.id))
  }, [categoryOptions, visibleCategoryIds])

  const selectCategory = (categoryId) => {
    setSelectedCategory(categoryId)
    setIsCategoryMenuOpen(false)

    if (visibleCategoryIds.includes(categoryId)) {
      return
    }

    setVisibleCategoryIds((current) => {
      const replacementIndex = Math.max(current.length - 1, 1)
      const next = [...current]
      next[replacementIndex] = categoryId
      return next
    })
  }

  const promotionProducts = Array.isArray(sectionsQuery.data?.promotionProducts)
    ? sectionsQuery.data.promotionProducts
    : []

  const productsQuery = useInfiniteQuery({
    queryKey: ['catalog-products', deferredQuery, selectedCategory],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams()
      params.set('page', String(pageParam))
      params.set('limit', String(pageSize))

      if (deferredQuery) {
        params.set('q', deferredQuery)
      }

      if (selectedCategory !== 'all') {
        params.set('categoryId', selectedCategory)
      }

      return fetchJson(`${apiBaseUrl}/api/catalog/products?${params.toString()}`)
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasMore) {
        return undefined
      }

      return (lastPage.page || 1) + 1
    },
    staleTime: 30 * 1000,
  })

  const products = useMemo(
    () =>
      productsQuery.data?.pages.flatMap((page) =>
        page.products.map((product) => ({
          ...product,
          image:
            Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : '/product-placeholder.svg',
        })),
      ) || [],
    [productsQuery.data],
  )

  const isLoadingInitial = productsQuery.isLoading
  const isEmpty = !isLoadingInitial && !productsQuery.isError && products.length === 0

  return (
    <div className="page">
      <section className="catalog-hero">
        <SectionHeading
          eyebrow="Catalog"
          title="Browse products with confidence"
          description="Search quickly, filter by category, and find the products that fit your needs without friction."
        />
      </section>

      {!deferredQuery && promotionProducts.length > 0 ? (
        <section className="catalog-promo">
          <SectionHeading
            eyebrow="Promotion"
            title="What the team wants you to see"
            description="These picks are chosen by the admin and only appear when there are products to show."
            align="center"
          />

          <div className="catalog-promo__grid">
            {promotionProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                category={product.category}
                name={product.name}
                description={product.description}
                price={Number(product.price) || 0}
                image={
                  Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : '/product-placeholder.svg'
                }
                images={product.images}
                inStock={(product.stockQuantity || 0) > 0}
                prescriptionRequired={product.prescriptionRequired}
              />
            ))}
          </div>
        </section>
      ) : null}

      <form className="catalog-toolbar" aria-label="Product filters" onSubmit={handleSearchSubmit}>
        <div className="catalog-search-form">
          <label className="catalog-search">
            <span className="catalog-search__icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
          </label>

          <button type="submit" className="catalog-search__button">
            Search
          </button>
        </div>

        <div className="catalog-category-filter">
          <div className="catalog-chips" role="list" aria-label="Category filters">
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`catalog-chip${selectedCategory === category.id ? ' is-active' : ''}`}
                onClick={() => selectCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {hiddenCategories.length > 0 ? (
            <div className="catalog-filter-menu">
              <button
                type="button"
                className={`catalog-filter-button${isCategoryMenuOpen ? ' is-open' : ''}`}
                aria-expanded={isCategoryMenuOpen}
                aria-haspopup="true"
                onClick={() => setIsCategoryMenuOpen((current) => !current)}
              >
                <FilterIcon />
                <span>More</span>
              </button>

              {isCategoryMenuOpen ? (
                <div className="catalog-filter-popover" role="menu">
                  <p className="catalog-filter-popover__title">Browse categories</p>
                  {hiddenCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`catalog-filter-option${selectedCategory === category.id ? ' is-active' : ''}`}
                      role="menuitem"
                      onClick={() => selectCategory(category.id)}
                    >
                      <span>{category.name}</span>
                      {selectedCategory === category.id ? <span aria-hidden="true">✓</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </form>

      <section className="catalog-results" aria-live="polite">
        {isLoadingInitial ? <p className="catalog-results__count">Loading catalog...</p> : null}

        {productsQuery.isError ? (
          <p className="catalog-results__count">
            {productsQuery.error?.message || 'Unable to load products right now.'}
          </p>
        ) : null}

        {isLoadingInitial ? (
          <div className="catalog-grid" aria-label="Loading products">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductSkeletonCard key={`skeleton-${index}`} />
            ))}
          </div>
        ) : null}

        {!isLoadingInitial && !productsQuery.isError && products.length > 0 ? (
          <div className="catalog-grid">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : null}

        {isEmpty ? (
          <div className="catalog-empty">
            <h3>No products match your search</h3>
            <p>Try a different keyword or choose a different category.</p>
          </div>
        ) : null}

        {productsQuery.hasNextPage ? (
          <div className="catalog-loadmore">
            <button
              type="button"
              className="catalog-loadmore__button"
              onClick={() => productsQuery.fetchNextPage()}
              disabled={productsQuery.isFetchingNextPage}
            >
              {productsQuery.isFetchingNextPage ? 'Loading more...' : 'Load more products'}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default ProductsPage

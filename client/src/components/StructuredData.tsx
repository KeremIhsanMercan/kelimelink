const SITE_URL = 'https://kelimelink.app';

interface StructuredDataProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Injects a JSON-LD <script> into <head>.
 * Cleans up on unmount or data change to avoid duplicates.
 */
export default function StructuredData({ data }: StructuredDataProps) {
  const json = JSON.stringify(Array.isArray(data) ? data : [data]);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

// ── Schema Factories ──────────────────────────────────────────────

export function createOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'KelimeLink',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'krmhsnmrcn220@gmail.com',
      contactType: 'customer support',
      availableLanguage: 'Turkish',
    },
    sameAs: [],
  };
}

export function createWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KelimeLink',
    url: SITE_URL,
    description:
      'Her gün yeni bir Türkçe kelime bağlantı bulmacası. İki uzak kelimeyi anlamsal köprüler kurarak birbirine bağlayın.',
    inLanguage: 'tr',
  };
}

export function createWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'SoftwareApplication'],
    name: 'KelimeLink',
    url: SITE_URL,
    applicationCategory: 'GameApplication',
    applicationSubCategory: 'Word Game',
    operatingSystem: 'Web',
    genre: 'Semantik Kelime Oyunu',
    numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2 },
    playMode: ['SinglePlayer', 'MultiPlayer'],
    inLanguage: 'tr-TR',
    description:
      'KelimeLink, iki kelime arasında anlamsal köprüler kurarak bağlantı oluşturduğunuz bir Türkçe kelime bulmacasıdır. Yapay zeka tabanlı dil modeli kullanarak kelimelerin anlamsal benzerliğini ölçer.',
    audience: {
      '@type': 'PeopleAudience',
      audienceType: 'Turkish speakers',
      geographicArea: 'Turkey'
    },
    featureList: [
      'Günlük bulmaca',
      'Pratik modu',
      'Gerçek zamanlı VS modu',
      'NLP tabanlı semantik analiz'
    ],
    screenshot: `${SITE_URL}/og-image.png`,
    alternateName: ['Linxicon Türkçe', 'Contexto Türkçe', 'Semantle Türkçe'],
    keywords: 'türkçe kelime oyunu, semantik bulmaca, linxicon alternatifi',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
    },
    author: {
      '@type': 'Organization',
      name: 'KelimeLink',
      url: SITE_URL,
    },
  };
}

export function createArticleSchema(opts: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    image: `${SITE_URL}/og-image.png`,
    inLanguage: 'tr',
    author: {
      '@type': 'Organization',
      name: 'KelimeLink',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'KelimeLink',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}${opts.path}`,
    },
  };
}

export function createFAQSchema(
  questions: { question: string; answer: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export function createBreadcrumbSchema(
  items: { name: string; path: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  path: string; // e.g. '/hakkinda', '/', '/blog/konseptnet-nasil-calisir'
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
}

const SITE_URL = 'https://kelimelink.app';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Sets page-level SEO meta tags (title, description, canonical, OG, Twitter).
 * Runs inside useEffect so the prerenderer (Puppeteer) captures the updated DOM.
 */
export function useSEO({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
}: SEOProps) {
  useEffect(() => {
    // --- Title ---
    document.title = title;

    // --- Meta description ---
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);

    // --- Canonical ---
    const canonicalUrl = `${SITE_URL}${path}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // --- Open Graph ---
    setMetaProperty('og:type', ogType);
    setMetaProperty('og:url', canonicalUrl);
    setMetaProperty('og:title', ogTitle || title);
    setMetaProperty('og:description', ogDescription || description);
    setMetaProperty('og:image', ogImage || DEFAULT_OG_IMAGE);

    // --- Twitter ---
    setMetaProperty('twitter:url', canonicalUrl);
    setMetaProperty('twitter:title', ogTitle || title);
    setMetaProperty('twitter:description', ogDescription || description);
    setMetaProperty('twitter:image', ogImage || DEFAULT_OG_IMAGE);
  }, [title, description, path, ogTitle, ogDescription, ogImage, ogType]);
}

/** Helper to set or create a <meta property="..."> tag */
function setMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

import Head from "next/head";
import { useRouter } from "next/router";

type StructuredData = Record<string, unknown> | Record<string, unknown>[];

export type SeoProps = {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "product";
  titleSuffix?: boolean;
  structuredData?: StructuredData;
};

const brandName = "VnU";
const defaultImage = "/brand/vnu-logo.jpeg";

function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return siteUrl ? `${siteUrl}${value.startsWith("/") ? value : `/${value}`}` : value;
}

export function Seo({
  title,
  description,
  canonicalPath,
  image = defaultImage,
  imageAlt = "VnU — Vibrant n Unique",
  keywords,
  noIndex = false,
  type = "website",
  titleSuffix = true,
  structuredData,
}: SeoProps) {
  const router = useRouter();
  const pageTitle = titleSuffix && !title.includes(brandName) ? `${title} | ${brandName}` : title;
  const route = canonicalPath ?? router.asPath.split(/[?#]/)[0] ?? "/";
  const canonical = absoluteUrl(route);
  const socialImage = absoluteUrl(image);
  const robots = noIndex ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  return <Head>
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    {keywords?.length ? <meta name="keywords" content={keywords.join(", ")} /> : null}
    <meta name="robots" content={robots} />
    <meta name="googlebot" content={robots} />
    <link rel="canonical" href={canonical} />
    <meta property="og:site_name" content={brandName} />
    <meta property="og:type" content={type} />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={socialImage} />
    <meta property="og:image:alt" content={imageAlt} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={pageTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={socialImage} />
    {structuredData ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /> : null}
  </Head>;
}

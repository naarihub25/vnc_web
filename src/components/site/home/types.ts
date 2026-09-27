import type { ReactNode } from "react";

export type CategoryCardData = {
  href?: string;
  imageUrl?: string;
  title: string;
  icon: string;
  color: string;
};

export type ProductCardData = {
  id?: string;
  slug?: string;
  href?: string;
  images?: { url: string; alt: string }[];
  title: string;
  description: string;
  icon: string;
  imageColor: string;
  price: string;
  originalPrice: string;
  discount: string;
};

export type ProductSectionData = {
  title: string;
  products: ProductCardData[];
};

export type TrustCardData = {
  title: string;
  detail: string;
  color: string;
  icon: ReactNode;
};

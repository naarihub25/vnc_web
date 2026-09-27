import { FeaturedProducts } from "./FeaturedProducts";

export function TrendingProducts() {
  return <FeaturedProducts filter="isTrending" title="Trending Now" />;
}

import { useStoreCategories } from "@/hooks/useStoreCategories";
import SearchIcon from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export type SearchSuggestion = {
  id: string;
  name: string;
  type: "category" | "product";
  slug?: string;
  image?: string;
};
export type SearchLoader = (query: string, signal: AbortSignal) => Promise<SearchSuggestion[]>;

type SearchProduct = { _id: string; name: string; slug: string; isActive: boolean; isRetail: boolean; isWholesale: boolean; images?: { url: string; alt: string }[] };
export function StoreSearch({ wholesale = false }: { wholesale?: boolean }) {
  const { categories } = useStoreCategories();
  const loadSuggestions = useCallback<SearchLoader>(async (query, signal) => {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const params = new URLSearchParams({ q: query, page: "1", limit: "10", isActive: "true", [wholesale ? "isWholesale" : "isRetail"]: "true" });
    const response = await fetch(`${base}/api/products/search?${params}`, { signal, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data?.products)) throw new Error("Search unavailable");
    const products: SearchSuggestion[] = data.products
      .filter((product: SearchProduct) => product.isActive && (wholesale ? product.isWholesale : product.isRetail))
      .map((product: SearchProduct) => ({ id: product._id, name: product.name, slug: product.slug, type: "product", image: product.images?.[0]?.url }));
    const matchingCategories: SearchSuggestion[] = categories.filter((category) => category.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
      .slice(0, 4).map((category) => ({ id: category._id, name: category.name, slug: category.slug, type: "category", image: category.imageUrl }));
    return [...matchingCategories, ...products];
  }, [categories, wholesale]);
  const router = useRouter();
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ query: string; options: SearchSuggestion[]; error: boolean }>({ query: "", options: [], error: false });
  const query = input.trim();
  const pending = open && query.length >= 2 && result.query !== query;
  useEffect(() => {
    if (!open || query.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const options = await loadSuggestions(query, controller.signal);
        if (!controller.signal.aborted) setResult({ query, options, error: false });
      } catch {
        if (!controller.signal.aborted) setResult({ query, options: [], error: true });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, open, loadSuggestions]);
  return <Autocomplete<SearchSuggestion>
    fullWidth open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}
    inputValue={input} value={null} onInputChange={(_, value, reason) => {
      if (reason === "input" || reason === "clear") { setInput(value); setOpen(reason === "input"); }
    }}
    options={query.length >= 2 && result.query === query ? result.options : []}
    filterOptions={(options) => options} getOptionLabel={(option) => option.name}
    getOptionKey={(option) => `${option.type}:${option.id}`}
    isOptionEqualToValue={(a, b) => a.id === b.id && a.type === b.type}
    loading={pending} loadingText="Searching..."
    noOptionsText={query.length < 2 ? "Type at least 2 characters to search" : result.error ? "Search unavailable. Try typing again." : "No matching products or categories"}
    onChange={(_, option) => {
      if (!option) return;
      const prefix = wholesale ? "/wholesale" : "";
      const href = option.type === "category" && option.slug
        ? `${prefix}/categories/${encodeURIComponent(option.slug)}`
        : option.type === "product" ? `${prefix}/products/${encodeURIComponent(option.slug || option.id)}` : null;
      if (href) { setOpen(false); setInput(""); void router.push(href); }
    }}
    renderOption={(props, option) => {
      const { key, ...rest } = props;
      return <Box component="li" key={key} {...rest}>
        {option.image ? <Box component="img" src={option.image} alt="" sx={{ width: 40, height: 40, objectFit: "contain", mr: 1.5, borderRadius: 1 }} /> : null}
        <Box><Typography variant="body2">{option.name}</Typography><Typography variant="caption" color="text.secondary">{option.type === "category" ? "Category" : "Product"}</Typography></Box>
      </Box>;
    }}
    renderInput={(params) => <TextField {...params} label="Search products and categories"
      slotProps={{ ...params.slotProps, input: { ...params.slotProps.input, startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
        endAdornment: <>{pending ? <CircularProgress size={18} /> : null}{params.slotProps.input.endAdornment}</> },
        htmlInput: { ...params.slotProps.htmlInput, autoComplete: "off" } }} />}
  />;
}

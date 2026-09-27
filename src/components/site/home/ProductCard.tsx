import Link from "next/link";
import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ProductCardData } from "./types";
import { border, coral, ink, muted, peach } from "./toyNestTokens";

export function ProductCard({ product }: { product: ProductCardData }) {
  const href = product.href ?? (product.slug || product.id ? `/products/${encodeURIComponent(product.slug || product.id!)}` : undefined);
  const [selectedImage, setSelectedImage] = useState(0);
  const image = product.images?.[selectedImage] ?? product.images?.[0];
  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "common.white",
        border: 1,
        borderColor: border,
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        minHeight: 390,
        overflow: "hidden",
        p: 1.25,
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: product.imageColor,
          borderRadius: 2.5,
          display: "flex",
          justifyContent: "center",
          minHeight: 202,
          position: "relative",
        }}
      >
        {image ? <Box component="img" src={image.url} alt={image.alt || product.title} sx={{ width: "100%", height: 202, objectFit: "contain" }} /> : <Typography aria-label={product.title} role="img" sx={{ fontSize: 86 }}>
          {product.icon}
        </Typography>}
      </Box>

      {product.images ? (product.images.length > 1 ? <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap" }}>
        {product.images.map((item, index) => <Box key={`${item.url}-${index}`} component="button" type="button"
          aria-label={`View image ${index + 1} of ${product.title}`} aria-pressed={selectedImage === index}
          onClick={() => setSelectedImage(index)} sx={{ position: "relative", zIndex: 2, p: 0.25, border: 1, borderColor: selectedImage === index ? "primary.main" : "divider", borderRadius: 1, bgcolor: "background.paper", cursor: "pointer" }}>
          <Box component="img" src={item.url} alt={item.alt || ""} sx={{ width: 44, height: 40, objectFit: "contain" }} />
        </Box>)}
      </Stack> : null) : <Stack direction="row" spacing={1.1} sx={{ mt: 1.25 }}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              bgcolor: product.imageColor,
              borderRadius: 1.5,
              height: 44,
              width: 48,
            }}
          />
        ))}
        <Box
          sx={{
            alignItems: "center",
            bgcolor: peach,
            borderRadius: 1.5,
            color: ink,
            display: "flex",
            fontSize: 12,
            fontWeight: 800,
            height: 44,
            justifyContent: "center",
            width: 48,
          }}
        >
          +2
        </Box>
      </Stack>}

      <Box sx={{ mt: 1.5 }}>
        <Typography
          sx={{
            color: ink,
            fontSize: 15,
            fontWeight: 800,
            minHeight: 23,
          }}
        >
          {href ? <Link href={href}>{product.title}<Box component="span" sx={{ position: "absolute", inset: 0, zIndex: 1 }} /></Link> : product.title}
        </Typography>
        <Typography sx={{ color: muted, fontSize: 11, minHeight: 34, mt: 0.5 }}>
          {product.description}
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", mt: "auto" }}
      >
        {product.originalPrice ? <Typography
          sx={{
            color: muted,
            fontSize: 13,
            textDecoration: "line-through",
          }}
        >
          {product.originalPrice}
        </Typography> : null}
        <Typography sx={{ color: coral, fontSize: 21, fontWeight: 800 }}>
          {product.price}
        </Typography>
        {product.discount ? <Box
          sx={{
            bgcolor: coral,
            borderRadius: 1.5,
            color: "common.white",
            fontSize: 10,
            fontWeight: 800,
            ml: "auto",
            px: 1.1,
            py: 0.55,
            whiteSpace: "nowrap",
          }}
        >
          {product.discount}
        </Box> : null}
      </Stack>
    </Box>
  );
}

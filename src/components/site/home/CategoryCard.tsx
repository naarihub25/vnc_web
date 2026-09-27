import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { CategoryCardData } from "./types";
import { ink } from "./toyNestTokens";

export function CategoryCard({ category }: { category: CategoryCardData }) {
  return (
    <Box
      component="a"
      href={category.href ?? "#"}
      sx={{
        bgcolor: category.color,
        borderRadius: 3,
        color: ink,
        display: "grid",
        gridTemplateRows: "1fr auto",
        minHeight: 176,
        p: 1.75,
        textAlign: "center",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          boxShadow: "0 12px 28px rgba(9, 26, 60, 0.1)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          alignSelf: "center",
          fontSize: 58,
          lineHeight: 1,
          minHeight: 76,
        }}
      >
        {category.imageUrl ? <Box component="img" src={category.imageUrl} alt="" sx={{ width: "100%", height: 90, objectFit: "contain" }} /> : category.icon}
      </Box>
      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
        {category.title}
      </Typography>
    </Box>
  );
}

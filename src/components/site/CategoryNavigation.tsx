import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useId, useState } from "react";
import { categoryHref, parentId, useStoreCategories } from "@/hooks/useStoreCategories";

export function CategoryNavigation({ wholesale = false, mobileOpen, onMobileClose }: {
  wholesale?: boolean; mobileOpen: boolean; onMobileClose: () => void;
}) {
  const { categories, roots, loading, error, retry } = useStoreCategories();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const id = useId();
  const root = roots.find((category) => category._id === selected);
  const children = categories.filter((category) => parentId(category) === selected);
  const status = loading ? <Typography role="status" sx={{ p: 2 }}>Loading categories...</Typography> : error ?
    <Button onClick={() => void retry()}>Categories unavailable — retry</Button> : !roots.length ? <Typography sx={{ p: 2 }}>No categories available.</Typography> : null;
  const close = () => { setAnchor(null); setSelected(null); };
  return <>
    <Stack component="nav" aria-label="Shop categories" direction="row" sx={{ display: { xs: "none", md: "flex" }, flex: "1 1 auto", justifyContent: "flex-start", gap: { md: 0, lg: 1 }, overflowX: "auto", minWidth: 0, ml: 0 }}>
      {status}
      {roots.map((category) => <Button key={category._id} color="inherit" endIcon={<ExpandMoreIcon />}
        aria-haspopup="menu" aria-expanded={selected === category._id && Boolean(anchor)}
        aria-controls={selected === category._id && anchor ? id : undefined}
        sx={{ flexShrink: 0 }} onClick={(event) => { setSelected(category._id); setAnchor(event.currentTarget); }}>
        {category.name}
      </Button>)}
    </Stack>
    <Menu id={id} anchorEl={anchor} open={Boolean(anchor && root)} onClose={close}
      slotProps={{ paper: { sx: { width: 680, maxWidth: "calc(100vw - 32px)", p: 2 } }, list: { sx: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 } } }}>
      {root ? <MenuItem component={Link} href={categoryHref(root, wholesale)} onClick={close} sx={{ gridColumn: "1 / -1", fontWeight: 700, whiteSpace: "normal" }}>Shop all {root.name}</MenuItem> : null}
      {children.map((category) => <MenuItem key={category._id} component={Link} href={categoryHref(category, wholesale)} onClick={close} sx={{ whiteSpace: "normal" }}>{category.name}</MenuItem>)}
      {!children.length ? <MenuItem disabled>No subcategories available.</MenuItem> : null}
    </Menu>
    <Drawer open={mobileOpen} onClose={onMobileClose}>
      <Box component="nav" aria-label="Mobile shop categories" sx={{ width: 300, p: 2 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Typography variant="h6">Categories</Typography><Button onClick={onMobileClose}>Close</Button></Stack>
        {status}
        {roots.map((category) => <Box key={category._id} sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}>
          <Button fullWidth component={Link} href={categoryHref(category, wholesale)} onClick={onMobileClose} sx={{ justifyContent: "flex-start", fontWeight: 700 }}>{category.name}</Button>
          {categories.filter((child) => parentId(child) === category._id).map((child) => <Button fullWidth key={child._id} component={Link} href={categoryHref(child, wholesale)} onClick={onMobileClose} color="inherit" sx={{ justifyContent: "flex-start", pl: 3 }}>{child.name}</Button>)}
        </Box>)}
      </Box>
    </Drawer>
  </>;
}

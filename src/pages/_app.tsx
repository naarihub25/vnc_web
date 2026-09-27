import "@/styles/globals.css";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { AppProps } from "next/app";
import { appTheme } from "@/theme/appTheme";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";

export default function App(props: AppProps) {
  const { Component, pageProps } = props;
  return (
    <AppCacheProvider {...props}>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
    </AppCacheProvider>
  );
}

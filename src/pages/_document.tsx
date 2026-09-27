import { Html, Head, Main, NextScript } from "next/document";
import type { DocumentContext } from "next/document";
import { DocumentHeadTags, documentGetInitialProps, type DocumentHeadTagsProps } from "@mui/material-nextjs/v16-pagesRouter";

export default function Document(props: DocumentHeadTagsProps) {
  return (
    <Html lang="en">
      <Head>
        <DocumentHeadTags {...props} />
        <link rel="icon" type="image/jpeg" href="/brand/vnu-logo.jpeg" />
        <link rel="apple-touch-icon" href="/brand/vnu-logo.jpeg" />
        <meta name="theme-color" content="#0b5055" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = (ctx: DocumentContext) => documentGetInitialProps(ctx);

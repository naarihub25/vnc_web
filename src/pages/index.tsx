import { ToyNestHome } from "@/components";
import { Seo } from "@/components/site/Seo";

export default function RetailHome() {
  return (
    <>
      <Seo title="VnU — Vibrant n Unique" titleSuffix={false}
        description="Shop vibrant toys, thoughtful gifts, educational products and birthday picks for kids at VnU."
        keywords={["kids toys", "educational toys", "gifts", "birthday gifts", "VnU"]}
        structuredData={{ "@context": "https://schema.org", "@type": "Organization", name: "VnU", slogan: "Vibrant n Unique", logo: "/brand/vnu-logo.jpeg" }} />
      <ToyNestHome />
    </>
  );
}

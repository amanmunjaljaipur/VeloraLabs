import { HomePageGate } from "@/components/home/HomePageGate";
import { MarketingHome } from "@/components/home/MarketingHome";
import { FaqPageJsonLd } from "@/components/seo/FaqPageJsonLd";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import { getHomeContentData } from "@/lib/cms/home-content-data";
import { homeMetadata } from "@/lib/page-metadata";

export const metadata = homeMetadata();

export default function HomePage() {
  const home = getHomeContentData();

  return (
    <>
      <FaqPageJsonLd items={home.homeFaqs} path="/" />
      <PersonJsonLd />
      <HomePageGate>
        <MarketingHome />
      </HomePageGate>
    </>
  );
}
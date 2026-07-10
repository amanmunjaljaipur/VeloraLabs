import { PublishedStoreApp } from "@/components/demo-stores/PublishedStoreApp";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ storeId: string; path?: string[] }>;
};

export async function generateMetadata({ params }: Props) {
  const { storeId } = await params;
  return createMetadata({
    title: `Store · ${storeId}`,
    description: "Published marketplace store",
    path: `/s/${storeId}`,
  });
}

/**
 * Permanent public store extension: /s/ecom-food_1 , /s/ecom-food_1/about , …
 */
export default async function PublishedStorePage({ params }: Props) {
  const { storeId, path } = await params;
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <PublishedStoreApp storeId={storeId.toLowerCase()} pathSegments={path || []} />
    </div>
  );
}

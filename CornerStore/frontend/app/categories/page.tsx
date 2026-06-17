import { CategoriesPageView } from "@/components/categories-page-view";
import { getTypesServer } from "@/lib/services/products";

export default async function CategoriesPage() {
  let types: { id: number; name: string }[] = [];
  try {
    types = await getTypesServer();
  } catch {
    types = [];
  }

  return <CategoriesPageView types={types} />;
}

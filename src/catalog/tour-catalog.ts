import { z } from "zod";

export const TourProductSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  destination: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  sampleMessage: z.string().min(1)
});

export const TourProductCatalogSchema = z.array(TourProductSchema);

export type TourProduct = Readonly<z.infer<typeof TourProductSchema>>;

export const FALLBACK_TOUR_PRODUCT: TourProduct = {
  productId: "jeju-private-tour",
  productName: "제주 프라이빗 투어",
  destination: "제주",
  aliases: ["제주", "제주투어", "제주 프라이빗", "jeju", "jeju private tour"],
  sampleMessage: "이수진입니다. 2026년 10월 3일 제주 프라이빗 투어 2명 상담 원합니다."
};

export const DEFAULT_TOUR_PRODUCTS = [
  FALLBACK_TOUR_PRODUCT,
  {
    productId: "osaka-family-package",
    productName: "오사카 가족 패키지",
    destination: "오사카",
    aliases: ["오사카", "오사카 패키지", "osaka", "osaka family package"],
    sampleMessage: "박준호입니다. 2026년 11월 12일 오사카 가족 패키지 4명 견적 부탁드립니다."
  },
  {
    productId: "danang-resort-product",
    productName: "다낭 리조트 상품",
    destination: "다낭",
    aliases: ["다낭", "다낭 리조트", "danang", "da nang", "danang resort"],
    sampleMessage: "최하나입니다. 2026년 12월 5일 다낭 리조트 상품 3명 예약 상담 원합니다."
  }
] satisfies readonly TourProduct[];

export function normalizeTourCatalog(products: readonly TourProduct[] = DEFAULT_TOUR_PRODUCTS): readonly TourProduct[] {
  return TourProductCatalogSchema.parse(products);
}

export function getPrimaryTourProduct(products: readonly TourProduct[] = DEFAULT_TOUR_PRODUCTS): TourProduct {
  return normalizeTourCatalog(products)[0] ?? FALLBACK_TOUR_PRODUCT;
}

export function addTourProduct(
  product: TourProduct,
  products: readonly TourProduct[] = DEFAULT_TOUR_PRODUCTS
): readonly TourProduct[] {
  const parsedProduct = TourProductSchema.parse(product);
  const catalogWithoutProduct = normalizeTourCatalog(products).filter(
    (candidate) => candidate.productId !== parsedProduct.productId
  );

  return [...catalogWithoutProduct, parsedProduct];
}

export function removeTourProduct(
  productId: string,
  products: readonly TourProduct[] = DEFAULT_TOUR_PRODUCTS
): readonly TourProduct[] {
  return normalizeTourCatalog(products).filter((product) => product.productId !== productId);
}

export function findTourProduct(
  text: string,
  products: readonly TourProduct[] = DEFAULT_TOUR_PRODUCTS
): TourProduct | undefined {
  const normalizedText = normalizeSearchText(text);

  return normalizeTourCatalog(products).find((product) =>
    getProductSearchTerms(product).some((term) => normalizedText.includes(normalizeSearchText(term)))
  );
}

function getProductSearchTerms(product: TourProduct): readonly string[] {
  return [product.productName, product.destination, ...product.aliases];
}

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

const defaultProducts = [
  {
    productId: "jeju-private-tour",
    productName: "제주 프라이빗 투어",
    destination: "제주",
    aliases: ["제주", "제주투어", "제주 프라이빗", "jeju", "jeju private tour"],
    sampleMessage: "이수진입니다. 2026년 10월 3일 제주 프라이빗 투어 2명 상담 원합니다."
  },
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
];

const catalogStorageKey = "travel-ai-product-catalog";
const selectedProductStorageKey = "travel-ai-selected-product";

const productList = document.querySelector("#productList");
const productForm = document.querySelector("#productForm");
const resetCatalogButton = document.querySelector("#resetCatalog");
const catalogStatus = document.querySelector("#catalogStatus");
const selectedProductTitle = document.querySelector("#selectedProductTitle");
const selectedProductId = document.querySelector("#selectedProductId");
const selectedDestination = document.querySelector("#selectedDestination");
const selectedAliases = document.querySelector("#selectedAliases");
const sampleMessage = document.querySelector("#sampleMessage");
const expectedDestination = document.querySelector("#expectedDestination");
const expectedProductId = document.querySelector("#expectedProductId");
const expectedProductName = document.querySelector("#expectedProductName");
const productNameInput = document.querySelector("#productNameInput");
const destinationInput = document.querySelector("#destinationInput");
const aliasesInput = document.querySelector("#aliasesInput");

let products = loadProducts();
let selectedProductIdValue = loadSelectedProductId(products);

render();

if (productForm instanceof HTMLFormElement) {
  productForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addProductFromForm(productForm);
  });
}

if (resetCatalogButton instanceof HTMLButtonElement) {
  resetCatalogButton.addEventListener("click", () => {
    products = [...defaultProducts];
    selectedProductIdValue = products[0]?.productId ?? "";
    persistState();
    render();
  });
}

function loadProducts() {
  const storedProducts = window.localStorage.getItem(catalogStorageKey);

  if (!storedProducts) {
    return [...defaultProducts];
  }

  try {
    const parsedProducts = JSON.parse(storedProducts);
    return isProductArray(parsedProducts) ? parsedProducts : [...defaultProducts];
  } catch {
    return [...defaultProducts];
  }
}

function loadSelectedProductId(currentProducts) {
  const storedProductId = window.localStorage.getItem(selectedProductStorageKey) ?? "";
  return currentProducts.some((product) => product.productId === storedProductId)
    ? storedProductId
    : currentProducts[0]?.productId ?? "";
}

function isProductArray(value) {
  return Array.isArray(value) && value.every(isProduct);
}

function isProduct(value) {
  return Boolean(
    value &&
      typeof value.productId === "string" &&
      typeof value.productName === "string" &&
      typeof value.destination === "string" &&
      Array.isArray(value.aliases) &&
      value.aliases.every((alias) => typeof alias === "string") &&
      typeof value.sampleMessage === "string"
  );
}

function addProductFromForm(form) {
  if (
    !(productNameInput instanceof HTMLInputElement) ||
    !(destinationInput instanceof HTMLInputElement) ||
    !(aliasesInput instanceof HTMLInputElement)
  ) {
    return;
  }

  const productName = productNameInput.value.trim();
  const destination = destinationInput.value.trim();
  const aliases = aliasesInput.value
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);

  if (!productName || !destination || aliases.length === 0) {
    return;
  }

  const product = {
    productId: createProductId(productName, destination),
    productName,
    destination,
    aliases,
    sampleMessage: `2026년 10월 3일 ${productName} 2명 상담 원합니다.`
  };

  products = [...products.filter((candidate) => candidate.productId !== product.productId), product];
  selectedProductIdValue = product.productId;
  form.reset();
  persistState();
  render();
}

function createProductId(productName, destination) {
  const normalizedSlug = productName
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");

  return normalizedSlug || `${destination}-${Date.now()}`;
}

function render() {
  const selectedProduct = getSelectedProduct();
  renderStatus(selectedProduct);
  renderProductList();
  renderSelectedProduct(selectedProduct);
}

function getSelectedProduct() {
  return products.find((product) => product.productId === selectedProductIdValue) ?? products[0];
}

function renderStatus(selectedProduct) {
  if (!(catalogStatus instanceof HTMLElement)) {
    return;
  }

  const selectedText = selectedProduct ? `${selectedProduct.productName} 기준` : "등록 상품 없음";
  catalogStatus.textContent = `운영 상품 ${products.length}개 · ${selectedText}`;
}

function renderProductList() {
  if (!(productList instanceof HTMLElement)) {
    return;
  }

  productList.replaceChildren();

  if (products.length === 0) {
    const emptyRow = document.createElement("p");
    emptyRow.className = "empty-row";
    emptyRow.textContent = "등록된 상품이 없습니다.";
    productList.append(emptyRow);
    return;
  }

  for (const product of products) {
    productList.append(createProductRow(product));
  }
}

function createProductRow(product) {
  const row = document.createElement("article");
  row.className = product.productId === selectedProductIdValue ? "product-row is-active" : "product-row";

  const summary = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = product.productName;
  const destination = document.createElement("span");
  destination.textContent = product.destination;
  summary.append(title, destination);

  const useButton = document.createElement("button");
  useButton.type = "button";
  useButton.className = "row-button";
  useButton.textContent = product.productId === selectedProductIdValue ? "선택됨" : "사용";
  useButton.disabled = product.productId === selectedProductIdValue;
  useButton.addEventListener("click", () => {
    selectedProductIdValue = product.productId;
    persistState();
    render();
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "×";
  deleteButton.setAttribute("aria-label", `${product.productName} 삭제`);
  deleteButton.title = `${product.productName} 삭제`;
  deleteButton.addEventListener("click", () => {
    products = products.filter((candidate) => candidate.productId !== product.productId);
    selectedProductIdValue = products[0]?.productId ?? "";
    persistState();
    render();
  });

  row.append(summary, useButton, deleteButton);
  return row;
}

function renderSelectedProduct(product) {
  const title = product?.productName ?? "상품 없음";
  const id = product?.productId ?? "미분류";
  const destination = product?.destination ?? "미분류";
  const aliases = product?.aliases.join(", ") ?? "미등록";
  const message = product?.sampleMessage ?? "상품을 추가하면 샘플 메시지가 생성됩니다.";

  setText(selectedProductTitle, title);
  setText(selectedProductId, id);
  setText(selectedDestination, destination);
  setText(selectedAliases, aliases);
  setText(sampleMessage, message);
  setText(expectedDestination, `destination: ${destination}`);
  setText(expectedProductId, `productId: ${id}`);
  setText(expectedProductName, `productName: ${title}`);
}

function setText(element, value) {
  if (element instanceof HTMLElement) {
    element.textContent = value;
  }
}

function persistState() {
  window.localStorage.setItem(catalogStorageKey, JSON.stringify(products));
  window.localStorage.setItem(selectedProductStorageKey, selectedProductIdValue);
}

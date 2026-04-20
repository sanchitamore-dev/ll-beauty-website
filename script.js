const CART_STORAGE_KEY = "ll_beauty_cart";
const WALLET_STORAGE_KEY = "ll_beauty_wallet";
const ORDERS_STORAGE_KEY = "ll_beauty_orders";
const LEADS_STORAGE_KEY = "ll_beauty_franchise_leads";
const EVA_AGENT_STORAGE_KEY = "ll_beauty_eva_agent_applications";
const PRODUCTS_DATA_PATH = "data/products.json";
const WALLET_DATA_PATH = "data/wallet.json";
const ORDERS_DATA_PATH = "data/orders.json";
const LEADS_DATA_PATH = "data/franchise-leads.json";
const EVA_AGENT_DATA_PATH = "data/eva-agent-applications.json";
const DEMO_OTP = "123456";
const DEFAULT_WALLET = {
  balance: 0,
  currency: "INR",
  rewardTokens: 0,
  rewardRules: {
    earnRate: 0.05,
    tokenValue: 1,
  },
  transactions: [],
};

const state = {
  products: new Map(),
  cart: loadCart(),
  wallet: {
    ...DEFAULT_WALLET,
    rewardRules: {
      ...DEFAULT_WALLET.rewardRules,
    },
    transactions: [],
  },
};

const franchiseForm = document.querySelector("#franchise-form");
const franchiseFormStatus = document.querySelector("#franchise-form-status");
const evaAgentForm = document.querySelector("#eva-agent-form");
const evaAgentFormStatus = document.querySelector("#eva-agent-form-status");
const launchSliderTrack = document.querySelector("#launch-slider-track");
const launchSlides = document.querySelectorAll("[data-launch-slide]");
const launchSliderPrev = document.querySelector("#launch-slider-prev");
const launchSliderNext = document.querySelector("#launch-slider-next");
const launchSliderDots = document.querySelectorAll("[data-launch-dot]");
const walletBalance = document.querySelector("#wallet-balance");
const walletBalanceNote = document.querySelector("#wallet-balance-note");
const rewardTokenBalance = document.querySelector("#reward-token-balance");
const rewardTokenNote = document.querySelector("#reward-token-note");
const walletTopupForm = document.querySelector("#wallet-topup-form");
const walletTopupStatus = document.querySelector("#wallet-topup-status");
const cartItems = document.querySelector("#cart-items");
const cartSubtotal = document.querySelector("#cart-subtotal");
const cartPayable = document.querySelector("#cart-payable");
const tokenDiscount = document.querySelector("#token-discount");
const tokenEarnedPreview = document.querySelector("#token-earned-preview");
const tokenRedeemInput = document.querySelector("#token-redeem-input");
const tokenRedeemNote = document.querySelector("#token-redeem-note");
const cartCount = document.querySelector("#cart-count");
const cartButton = document.querySelector("#cart-button");
const cartPanel = document.querySelector("#cart-panel");
const checkoutButton = document.querySelector("#wallet-checkout-button");
const checkoutStatus = document.querySelector("#checkout-status");
const quickTopupButtons = document.querySelectorAll("[data-topup-amount]");
const upiModal = document.querySelector("#upi-modal");
const upiModalAmount = document.querySelector("#upi-modal-amount");
const upiModalQrAmount = document.querySelector("#upi-modal-qr-amount");
const upiModalHandle = document.querySelector("#upi-modal-handle");
const upiModalAppLabel = document.querySelector("#upi-modal-app-label");
const upiModalBankLabel = document.querySelector("#upi-modal-bank-label");
const upiModalStatus = document.querySelector("#upi-modal-status");
const upiModalVpa = document.querySelector("#upi-modal-vpa");
const upiConfirmButton = document.querySelector("#upi-confirm-button");
const upiCloseButtons = document.querySelectorAll("[data-upi-close]");
const upiAppButtons = document.querySelectorAll("[data-upi-app]");

const UPI_APP_DETAILS = {
  "Google Pay": {
    bankLabel: "HDFC Bank •• 2814",
    payeeHandle: "llbeauty.wallet@oksbi",
    sampleVpa: "yourname@okhdfcbank",
  },
  PhonePe: {
    bankLabel: "ICICI Bank •• 8241",
    payeeHandle: "llbeauty.wallet@ybl",
    sampleVpa: "yourname@ybl",
  },
  "Paytm UPI": {
    bankLabel: "Axis Bank •• 1162",
    payeeHandle: "llbeauty.wallet@paytm",
    sampleVpa: "yourname@paytm",
  },
  "BHIM UPI": {
    bankLabel: "SBI Bank •• 4902",
    payeeHandle: "llbeauty.wallet@upi",
    sampleVpa: "yourname@upi",
  },
};

let pendingTopup = null;
let launchSliderIndex = 0;
let launchSliderAnimationFrame = null;
let launchSliderLastTimestamp = 0;
let launchSliderOffset = 0;
let launchSliderBaseCount = 0;
const LAUNCH_SLIDER_SPEED = 0.04;

function loadCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");

    if (!Array.isArray(storedCart)) {
      return [];
    }

    return storedCart
      .map((item) => ({
        id: String(item.id || "").trim(),
        quantity: Number(item.quantity) || 0,
      }))
      .filter((item) => item.id && item.quantity > 0);
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function readStorageJson(key, fallbackValue) {
  try {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) {
      return cloneData(fallbackValue);
    }

    return JSON.parse(storedValue);
  } catch {
    return cloneData(fallbackValue);
  }
}

function writeStorageJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function loadSeedJson(path, fallbackValue) {
  try {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Unable to load ${path}`);
    }

    return await response.json();
  } catch {
    return cloneData(fallbackValue);
  }
}

function normalizeWallet(wallet) {
  return {
    ...DEFAULT_WALLET,
    ...(wallet || {}),
    rewardRules: {
      ...DEFAULT_WALLET.rewardRules,
      ...(wallet?.rewardRules || {}),
    },
    transactions: Array.isArray(wallet?.transactions) ? wallet.transactions : [],
  };
}

async function loadPersistedCollection(storageKey, dataPath) {
  const seedValue = await loadSeedJson(dataPath, []);
  const collection = readStorageJson(storageKey, seedValue);
  const normalizedCollection = Array.isArray(collection) ? collection : cloneData(seedValue);

  if (!localStorage.getItem(storageKey)) {
    writeStorageJson(storageKey, normalizedCollection);
  }

  return normalizedCollection;
}

async function loadPersistedWallet() {
  const seededWallet = normalizeWallet(await loadSeedJson(WALLET_DATA_PATH, DEFAULT_WALLET));
  const wallet = normalizeWallet(readStorageJson(WALLET_STORAGE_KEY, seededWallet));

  if (!localStorage.getItem(WALLET_STORAGE_KEY)) {
    writeStorageJson(WALLET_STORAGE_KEY, wallet);
  }

  return wallet;
}

function parseCurrencyAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber || "").replace(/[^\d+]/g, "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function validateLead(payload) {
  const requiredFields = [
    "name",
    "mobile",
    "email",
    "city",
    "franchiseFormat",
    "preferredLocation",
    "areaAvailable",
    "investmentBudget",
    "otpCode",
  ];

  for (const field of requiredFields) {
    if (!String(payload[field] || "").trim()) {
      return `Missing required field: ${field}`;
    }
  }

  if (!isValidEmail(payload.email)) {
    return "Please enter a valid email address.";
  }

  const normalizedMobile = normalizePhoneNumber(payload.mobile);

  if (normalizedMobile.length < 10) {
    return "Please enter a valid mobile number.";
  }

  if (String(payload.otpCode).trim() !== DEMO_OTP) {
    return "Invalid OTP code. Use 123456 for this demo.";
  }

  return null;
}

function validateEvaAgentApplication(payload) {
  const requiredFields = [
    "agentType",
    "name",
    "phone",
    "email",
    "aadhaarNumber",
    "panNumber",
    "address",
    "shopAddress",
  ];

  for (const field of requiredFields) {
    if (!String(payload[field] || "").trim()) {
      return `Missing required field: ${field}`;
    }
  }

  if (!["Pre", "Paid"].includes(String(payload.agentType).trim())) {
    return "Please choose Pre or Paid agent type.";
  }

  if (!isValidEmail(payload.email)) {
    return "Please enter a valid email address.";
  }

  const normalizedPhone = normalizePhoneNumber(payload.phone);

  if (normalizedPhone.length < 10) {
    return "Please enter a valid phone number.";
  }

  if (!/^\d{12}$/.test(String(payload.aadhaarNumber).trim())) {
    return "Please enter a valid 12 digit Aadhaar card number.";
  }

  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(String(payload.panNumber).trim().toUpperCase())) {
    return "Please enter a valid PAN card number.";
  }

  return null;
}

function getRewardRules() {
  return {
    earnRate: Number(state.wallet.rewardRules?.earnRate) || 0.05,
    tokenValue: Number(state.wallet.rewardRules?.tokenValue) || 1,
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: state.wallet.currency || "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getProductMetaLabel(product) {
  if (product.metaLabel) {
    return product.metaLabel;
  }

  if (typeof product.rating === "number") {
    return `${product.rating.toFixed(1)} ★`;
  }

  return product.category;
}

function renderProductCard(product) {
  const visualClasses = ["product-visual", product.theme || "sand-blend"];

  if (product.image) {
    visualClasses.push("product-visual-photo");
  }

  const note = product.note ? escapeHtml(product.note) : "";
  const sourceUrl = product.sourceUrl ? escapeHtml(product.sourceUrl) : "";
  const sourceLabel = escapeHtml(product.sourceLabel || "View source");
  const noteMarkup =
    note || sourceUrl
      ? `<p class="product-note">${note}${sourceUrl ? ` <a href="${sourceUrl}" target="_blank" rel="noreferrer">${sourceLabel}</a>` : ""}</p>`
      : "";

  return `
    <article class="product-card" data-product-id="${escapeHtml(product.id)}">
      <div class="${visualClasses.join(" ")}">
        <span>${escapeHtml(product.badge || product.category)}</span>
        ${
          product.image
            ? `<img class="product-photo" src="${escapeHtml(product.image)}" alt="${escapeHtml(
                product.imageAlt || product.name
              )}" loading="lazy" />`
            : ""
        }
      </div>
      <div class="product-copy">
        <p class="product-type">${escapeHtml(product.category)}</p>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="product-meta">
          <strong>${formatCurrency(product.price)}</strong>
          <span>${escapeHtml(getProductMetaLabel(product))}</span>
        </div>
        ${noteMarkup}
        <button
          class="button button-primary"
          type="button"
          data-add-to-cart
          data-product-id="${escapeHtml(product.id)}"
        >
          Add to Cart
        </button>
      </div>
    </article>
  `;
}

function renderProductCatalogs() {
  const productGrids = document.querySelectorAll("[data-product-grid]");

  if (!productGrids.length) {
    return;
  }

  const products = Array.from(state.products.values()).sort((left, right) => {
    const orderDelta =
      (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER);

    if (orderDelta !== 0) {
      return orderDelta;
    }

    return String(left.name || "").localeCompare(String(right.name || ""));
  });

  productGrids.forEach((grid) => {
    const category = grid.dataset.productCategory;
    const scope = grid.dataset.productScope || "all";
    const limit = Number.parseInt(grid.dataset.productLimit || "", 10);
    let catalog = products;

    if (category) {
      catalog = catalog.filter((product) => product.category === category);
    }

    if (scope === "featured") {
      catalog = catalog.filter((product) => product.featured);
    }

    if (Number.isFinite(limit) && limit > 0) {
      catalog = catalog.slice(0, limit);
    }

    grid.innerHTML = catalog.length
      ? catalog.map((product) => renderProductCard(product)).join("")
      : `
          <article class="product-card">
            <div class="product-visual sand-blend">
              <span>Coming Soon</span>
            </div>
            <div class="product-copy">
              <p class="product-type">Catalog update</p>
              <h3>Fresh products are being added right now.</h3>
              <p>We are syncing this category with the latest live listings and will show them here shortly.</p>
            </div>
          </article>
        `;
  });
}

function formatTokens(amount) {
  const tokens = Math.max(0, Math.round(Number(amount) || 0));
  return `${tokens} token${tokens === 1 ? "" : "s"}`;
}

function getCartLineItems() {
  return state.cart
    .map((item) => {
      const product = state.products.get(item.id);

      if (!product) {
        return null;
      }

      return {
        ...item,
        product,
        lineTotal: product.price * item.quantity,
      };
    })
    .filter(Boolean);
}

function getCartQuantity() {
  return state.cart.reduce((total, item) => total + item.quantity, 0);
}

function getCheckoutPricing() {
  const lineItems = getCartLineItems();
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const { earnRate, tokenValue } = getRewardRules();
  const requestedTokens = Math.max(0, Math.round(Number(tokenRedeemInput?.value) || 0));
  const availableTokens = Math.max(0, Math.round(Number(state.wallet.rewardTokens) || 0));
  const maxRedeemableTokens = Math.min(availableTokens, Math.floor(subtotal / tokenValue));
  const tokensApplied = Math.min(requestedTokens, maxRedeemableTokens);
  const tokenDiscountValue = tokensApplied * tokenValue;
  const payable = subtotal - tokenDiscountValue;
  const estimatedEarnedTokens = Math.floor(payable * earnRate);

  return {
    lineItems,
    subtotal,
    availableTokens,
    maxRedeemableTokens,
    tokensApplied,
    tokenDiscountValue,
    payable,
    estimatedEarnedTokens,
  };
}

function updateCartCount() {
  if (!cartCount) {
    return;
  }

  cartCount.textContent = String(getCartQuantity());
}

function getLaunchSlideWidth() {
  const firstSlide = launchSliderTrack?.querySelector("[data-launch-slide]");
  return firstSlide ? firstSlide.getBoundingClientRect().width : 0;
}

function getLaunchSliderLoopWidth() {
  return getLaunchSlideWidth() * launchSliderBaseCount;
}

function renderLaunchSlider(index) {
  if (!launchSliderTrack || !launchSliderBaseCount) {
    return;
  }

  launchSliderIndex = (index + launchSliderBaseCount) % launchSliderBaseCount;
  launchSliderOffset = getLaunchSlideWidth() * launchSliderIndex;
  launchSliderTrack.style.transform = `translateX(-${launchSliderOffset}px)`;

  launchSliderDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === launchSliderIndex);
    dot.setAttribute("aria-current", dotIndex === launchSliderIndex ? "true" : "false");
  });
}

function syncLaunchSliderFromOffset() {
  if (!launchSliderTrack || !launchSliderBaseCount) {
    return;
  }

  const loopWidth = getLaunchSliderLoopWidth();

  if (!loopWidth) {
    return;
  }

  launchSliderOffset = ((launchSliderOffset % loopWidth) + loopWidth) % loopWidth;
  const slideWidth = getLaunchSlideWidth();

  if (!slideWidth) {
    return;
  }

  launchSliderIndex = Math.round(launchSliderOffset / slideWidth) % launchSliderBaseCount;
  launchSliderTrack.style.transform = `translateX(-${launchSliderOffset}px)`;

  launchSliderDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === launchSliderIndex);
    dot.setAttribute("aria-current", dotIndex === launchSliderIndex ? "true" : "false");
  });
}

function stopLaunchSliderAutoplay() {
  if (!launchSliderAnimationFrame) {
    return;
  }

  window.cancelAnimationFrame(launchSliderAnimationFrame);
  launchSliderAnimationFrame = null;
  launchSliderLastTimestamp = 0;
}

function stepLaunchSlider(timestamp) {
  if (!launchSliderTrack || launchSliderBaseCount < 2) {
    return;
  }

  if (!launchSliderLastTimestamp) {
    launchSliderLastTimestamp = timestamp;
  }

  const delta = timestamp - launchSliderLastTimestamp;
  launchSliderLastTimestamp = timestamp;
  launchSliderOffset += delta * LAUNCH_SLIDER_SPEED;
  syncLaunchSliderFromOffset();
  launchSliderAnimationFrame = window.requestAnimationFrame(stepLaunchSlider);
}

function startLaunchSliderAutoplay() {
  if (!launchSliderTrack || launchSliderBaseCount < 2) {
    return;
  }

  if (launchSliderAnimationFrame) {
    return;
  }

  launchSliderAnimationFrame = window.requestAnimationFrame(stepLaunchSlider);
}

function setupLaunchSlider() {
  if (!launchSliderTrack || !launchSlides.length) {
    return;
  }

  launchSliderBaseCount = launchSlides.length;

  if (!launchSliderTrack.dataset.continuousReady) {
    launchSlides.forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("a, button, input, select, textarea").forEach((element) => {
        element.tabIndex = -1;
      });
      launchSliderTrack.append(clone);
    });

    launchSliderTrack.dataset.continuousReady = "true";
  }

  renderLaunchSlider(0);

  if (launchSliderPrev) {
    launchSliderPrev.addEventListener("click", () => {
      renderLaunchSlider(launchSliderIndex - 1);
    });
  }

  if (launchSliderNext) {
    launchSliderNext.addEventListener("click", () => {
      renderLaunchSlider(launchSliderIndex + 1);
    });
  }

  launchSliderDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      renderLaunchSlider(Number(dot.dataset.launchDot || 0));
    });
  });

  launchSliderTrack.addEventListener("mouseenter", stopLaunchSliderAutoplay);
  launchSliderTrack.addEventListener("mouseleave", startLaunchSliderAutoplay);
  launchSliderTrack.addEventListener("focusin", stopLaunchSliderAutoplay);
  launchSliderTrack.addEventListener("focusout", startLaunchSliderAutoplay);
  window.addEventListener("resize", () => {
    renderLaunchSlider(launchSliderIndex);
  });

  startLaunchSliderAutoplay();
}

function renderWallet() {
  if (!walletBalance || !walletBalanceNote) {
    return;
  }

  walletBalance.textContent = formatCurrency(state.wallet.balance);
  if (rewardTokenBalance) {
    rewardTokenBalance.textContent = formatTokens(state.wallet.rewardTokens);
  }

  const latestTransaction = state.wallet.transactions?.[0];

  if (!latestTransaction) {
    walletBalanceNote.textContent = "No wallet activity yet. Add money to start shopping.";
    if (rewardTokenNote) {
      rewardTokenNote.textContent = "Earn 5% back in tokens after every paid order.";
    }
    return;
  }

  if (latestTransaction.type === "top_up") {
    walletBalanceNote.textContent = `Last top-up: ${formatCurrency(latestTransaction.amount)} added successfully.`;
    if (rewardTokenNote) {
      rewardTokenNote.textContent = "Token wallet is ready for your next purchase.";
    }
    return;
  }

  if (latestTransaction.type === "reward_earned") {
    walletBalanceNote.textContent = "Last order completed successfully from wallet balance.";
    if (rewardTokenNote) {
      rewardTokenNote.textContent = `Last reward: ${formatTokens(latestTransaction.amount)} added to your token wallet.`;
    }
    return;
  }

  if (latestTransaction.type === "reward_redeemed") {
    walletBalanceNote.textContent = `Last redemption: ${formatCurrency(latestTransaction.value)} covered with tokens.`;
    if (rewardTokenNote) {
      rewardTokenNote.textContent = `${formatTokens(latestTransaction.amount)} reused on your latest order.`;
    }
    return;
  }

  walletBalanceNote.textContent = `Last payment: ${formatCurrency(latestTransaction.amount)} spent from wallet.`;
  if (rewardTokenNote) {
    rewardTokenNote.textContent = "Earn 5% back in tokens after every paid order.";
  }
}

function renderCart() {
  updateCartCount();

  if (!cartItems || !checkoutButton) {
    return;
  }

  const pricing = getCheckoutPricing();

  if (tokenRedeemInput) {
    tokenRedeemInput.max = String(pricing.maxRedeemableTokens);
    tokenRedeemInput.value = String(pricing.tokensApplied);
  }

  if (cartSubtotal) {
    cartSubtotal.textContent = formatCurrency(pricing.subtotal);
  }

  if (cartPayable) {
    cartPayable.textContent = formatCurrency(pricing.payable);
  }

  if (tokenDiscount) {
    tokenDiscount.textContent = `-${formatCurrency(pricing.tokenDiscountValue)}`;
  }

  if (tokenEarnedPreview) {
    tokenEarnedPreview.textContent = formatTokens(pricing.estimatedEarnedTokens);
  }

  if (tokenRedeemNote) {
    tokenRedeemNote.textContent = `${formatTokens(pricing.availableTokens)} available. Up to ${formatTokens(
      pricing.maxRedeemableTokens
    )} can be used on this order.`;
  }

  checkoutButton.disabled = pricing.lineItems.length === 0;
  checkoutButton.textContent =
    pricing.lineItems.length === 0 ? "Pay from Wallet" : `Pay ${formatCurrency(pricing.payable)} from Wallet`;

  if (!pricing.lineItems.length) {
    cartItems.innerHTML =
      '<p class="cart-empty">Your cart is empty. Add products to pay from wallet.</p>';
    return;
  }

  cartItems.innerHTML = pricing.lineItems
    .map(
      (item) => `
        <article class="cart-row">
          <div>
            <h4>${item.product.name}</h4>
            <p>${item.product.category} · ${formatCurrency(item.product.price)} each</p>
          </div>
          <div class="cart-item-quantity">
            <strong>x${item.quantity}</strong>
            <button class="cart-remove" type="button" data-remove-item="${item.id}">Remove</button>
          </div>
        </article>
      `
    )
    .join("");
}

function setTopupStatus(message, isError = false) {
  if (!walletTopupStatus) {
    return;
  }

  walletTopupStatus.textContent = message;
  walletTopupStatus.style.color = isError ? "#8c2e3b" : "";
}

function setCheckoutStatus(message, isError = false) {
  if (!checkoutStatus) {
    return;
  }

  checkoutStatus.textContent = message;
  checkoutStatus.style.color = isError ? "#8c2e3b" : "";
}

function setUpiModalStatus(message, isError = false) {
  if (!upiModalStatus) {
    return;
  }

  upiModalStatus.textContent = message;
  upiModalStatus.style.color = isError ? "#8c2e3b" : "";
}

function getUpiAppDetails(appName) {
  return UPI_APP_DETAILS[appName] || UPI_APP_DETAILS["Google Pay"];
}

function sanitizeUpiId(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidUpiId(value) {
  return /^[a-z0-9._-]{2,}@[a-z0-9._-]{2,}$/i.test(value);
}

function syncUpiAppSelection(appName) {
  if (walletTopupForm?.elements.source) {
    walletTopupForm.elements.source.value = appName;
  }

  upiAppButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.upiApp === appName);
  });
}

function renderUpiModal() {
  if (!pendingTopup) {
    return;
  }

  const details = getUpiAppDetails(pendingTopup.source);
  const upiId = sanitizeUpiId(pendingTopup.upiId) || details.sampleVpa;

  if (upiModalAmount) {
    upiModalAmount.textContent = formatCurrency(pendingTopup.amount);
  }

  if (upiModalQrAmount) {
    upiModalQrAmount.textContent = formatCurrency(pendingTopup.amount);
  }

  if (upiModalHandle) {
    upiModalHandle.textContent = details.payeeHandle;
  }

  if (upiModalAppLabel) {
    upiModalAppLabel.textContent = pendingTopup.source;
  }

  if (upiModalBankLabel) {
    upiModalBankLabel.textContent = details.bankLabel;
  }

  if (upiModalVpa) {
    upiModalVpa.value = upiId;
    upiModalVpa.placeholder = details.sampleVpa;
  }

  syncUpiAppSelection(pendingTopup.source);
}

function openUpiModal() {
  if (!walletTopupForm || !upiModal) {
    return;
  }

  if (!walletTopupForm.reportValidity()) {
    return;
  }

  const amount = Number(walletTopupForm.elements.amount.value);
  const source = String(walletTopupForm.elements.source.value || "Google Pay").trim();

  if (!Number.isFinite(amount) || amount < 100) {
    setTopupStatus("Top-up amount must be at least ₹100.", true);
    return;
  }

  pendingTopup = {
    amount: Math.round(amount),
    source,
    upiId: sanitizeUpiId(upiModalVpa?.value) || getUpiAppDetails(source).sampleVpa,
  };

  renderUpiModal();
  setTopupStatus(`UPI payment opened for ${formatCurrency(pendingTopup.amount)}.`);
  setUpiModalStatus("Open a UPI app and confirm the payment to continue.");
  upiModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeUpiModal() {
  if (!upiModal) {
    return;
  }

  upiModal.hidden = true;
  document.body.classList.remove("modal-open");
  setUpiModalStatus("Open a UPI app and confirm the payment to continue.");
}

async function processWalletTopup(payload) {
  const amount = parseCurrencyAmount(payload.amount);
  const source = String(payload.source || "bank account").trim();

  if (!amount || amount < 100) {
    throw new Error("Top-up amount must be at least ₹100.");
  }

  const updatedWallet = normalizeWallet({
    ...state.wallet,
    balance: state.wallet.balance + amount,
    transactions: [
      {
        id: `txn_${Date.now()}`,
        type: "top_up",
        amount,
        source,
        createdAt: new Date().toISOString(),
      },
      ...(state.wallet.transactions || []),
    ].slice(0, 12),
  });

  writeStorageJson(WALLET_STORAGE_KEY, updatedWallet);

  return {
    message: `Demo wallet credited with ₹${amount} from ${source}.`,
    wallet: updatedWallet,
  };
}

function updateCart(productId) {
  const existingItem = state.cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({ id: productId, quantity: 1 });
  }

  saveCart();
  renderCart();
}

function removeCartItem(productId) {
  state.cart = state.cart.filter((item) => item.id !== productId);
  saveCart();
  renderCart();
}

async function processWalletCheckout(payload) {
  const cartItems = Array.isArray(payload.items) ? payload.items : [];
  const requestedTokens = parseCurrencyAmount(payload.tokensToRedeem ?? 0);
  const safeRequestedTokens = requestedTokens === null ? null : Math.max(0, requestedTokens);

  if (!cartItems.length) {
    throw new Error("Your cart is empty.");
  }

  if (safeRequestedTokens === null) {
    throw new Error("Tokens to redeem must be a valid number.");
  }

  const normalizedItems = [];
  let total = 0;

  for (const item of cartItems) {
    const product = state.products.get(String(item.id || "").trim());
    const quantity = parseCurrencyAmount(item.quantity);

    if (!product || !quantity || quantity < 1) {
      throw new Error("Cart contains an invalid product or quantity.");
    }

    const lineTotal = product.price * quantity;
    total += lineTotal;
    normalizedItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      lineTotal,
    });
  }

  const tokenValue = Math.max(1, parseCurrencyAmount(state.wallet.rewardRules?.tokenValue) || 1);
  const maxRedeemableTokens = Math.min(state.wallet.rewardTokens || 0, Math.floor(total / tokenValue));
  const tokensRedeemed = Math.min(safeRequestedTokens, maxRedeemableTokens);
  const tokenDiscount = tokensRedeemed * tokenValue;
  const payableTotal = total - tokenDiscount;
  const earnedTokens = Math.floor(payableTotal * (state.wallet.rewardRules?.earnRate || 0));

  if (state.wallet.balance < payableTotal) {
    throw new Error(`Insufficient wallet balance. Add ₹${payableTotal - state.wallet.balance} more to continue.`);
  }

  const timestamp = Date.now();
  const createdAt = new Date().toISOString();
  const order = {
    id: `order_${timestamp}`,
    items: normalizedItems,
    subtotal: total,
    tokensRedeemed,
    tokenDiscount,
    total: payableTotal,
    earnedTokens,
    currency: state.wallet.currency || "INR",
    paymentMethod: "wallet",
    createdAt,
  };

  const walletTransactions = [];

  if (tokensRedeemed > 0) {
    walletTransactions.push({
      id: `txn_${timestamp}_redeem`,
      type: "reward_redeemed",
      amount: tokensRedeemed,
      value: tokenDiscount,
      orderId: order.id,
      createdAt,
    });
  }

  walletTransactions.push({
    id: `txn_${timestamp}_purchase`,
    type: "purchase",
    amount: payableTotal,
    orderId: order.id,
    createdAt,
  });

  if (earnedTokens > 0) {
    walletTransactions.push({
      id: `txn_${timestamp}_reward`,
      type: "reward_earned",
      amount: earnedTokens,
      orderId: order.id,
      createdAt,
    });
  }

  const updatedWallet = normalizeWallet({
    ...state.wallet,
    balance: state.wallet.balance - payableTotal,
    rewardTokens: (state.wallet.rewardTokens || 0) - tokensRedeemed + earnedTokens,
    transactions: [...walletTransactions.reverse(), ...(state.wallet.transactions || [])].slice(0, 20),
  });
  const orders = await loadPersistedCollection(ORDERS_STORAGE_KEY, ORDERS_DATA_PATH);

  orders.unshift(order);
  writeStorageJson(ORDERS_STORAGE_KEY, orders);
  writeStorageJson(WALLET_STORAGE_KEY, updatedWallet);

  return {
    message:
      earnedTokens > 0
        ? `Demo payment successful. Order ${order.id} confirmed and ${earnedTokens} tokens earned.`
        : `Demo payment successful. Order ${order.id} confirmed.`,
    order,
    wallet: updatedWallet,
  };
}

async function submitFranchiseLead(payload) {
  const validationError = validateLead(payload);

  if (validationError) {
    throw new Error(validationError);
  }

  const leads = await loadPersistedCollection(LEADS_STORAGE_KEY, LEADS_DATA_PATH);
  const lead = {
    id: `lead_${Date.now()}`,
    name: String(payload.name).trim(),
    mobile: normalizePhoneNumber(payload.mobile),
    email: String(payload.email).trim().toLowerCase(),
    city: String(payload.city).trim(),
    franchiseFormat: String(payload.franchiseFormat).trim(),
    preferredLocation: String(payload.preferredLocation).trim(),
    areaAvailable: String(payload.areaAvailable).trim(),
    investmentBudget: String(payload.investmentBudget).trim(),
    otpVerified: true,
    source: "github-pages-demo",
    createdAt: new Date().toISOString(),
  };

  leads.unshift(lead);
  writeStorageJson(LEADS_STORAGE_KEY, leads);

  return {
    message: "Thanks. Your franchise request has been saved in this browser demo.",
    lead,
  };
}

async function submitEvaAgentApplication(payload) {
  const validationError = validateEvaAgentApplication(payload);

  if (validationError) {
    throw new Error(validationError);
  }

  const applications = await loadPersistedCollection(EVA_AGENT_STORAGE_KEY, EVA_AGENT_DATA_PATH);
  const application = {
    id: `eva_agent_${Date.now()}`,
    agentType: String(payload.agentType).trim(),
    name: String(payload.name).trim(),
    phone: normalizePhoneNumber(payload.phone),
    email: String(payload.email).trim().toLowerCase(),
    aadhaarNumber: String(payload.aadhaarNumber).trim(),
    panNumber: String(payload.panNumber).trim().toUpperCase(),
    address: String(payload.address).trim(),
    shopAddress: String(payload.shopAddress).trim(),
    source: "github-pages-demo",
    createdAt: new Date().toISOString(),
  };

  applications.unshift(application);
  writeStorageJson(EVA_AGENT_STORAGE_KEY, applications);

  return {
    message: "Thanks. Your Eva AI Agent application has been saved in this browser demo.",
    application,
  };
}

async function hydrateStorefront() {
  const [products, wallet] = await Promise.all([
    loadSeedJson(PRODUCTS_DATA_PATH, []),
    loadPersistedWallet(),
    loadPersistedCollection(ORDERS_STORAGE_KEY, ORDERS_DATA_PATH),
    loadPersistedCollection(LEADS_STORAGE_KEY, LEADS_DATA_PATH),
    loadPersistedCollection(EVA_AGENT_STORAGE_KEY, EVA_AGENT_DATA_PATH),
  ]);

  state.products = new Map(products.map((product) => [product.id, product]));
  state.wallet = normalizeWallet(wallet);
  renderProductCatalogs();
  renderWallet();
  renderCart();
}

if (walletTopupForm) {
  walletTopupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    openUpiModal();
  });
}

quickTopupButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!walletTopupForm) {
      return;
    }

    walletTopupForm.elements.amount.value = button.dataset.topupAmount || "1000";
    setTopupStatus(`Top-up amount set to ${formatCurrency(walletTopupForm.elements.amount.value)}.`);
  });
});

upiAppButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!pendingTopup) {
      pendingTopup = {
        amount: Number(walletTopupForm?.elements.amount.value) || 1000,
        source: button.dataset.upiApp || "Google Pay",
        upiId: sanitizeUpiId(upiModalVpa?.value),
      };
    } else {
      pendingTopup.source = button.dataset.upiApp || pendingTopup.source;
      pendingTopup.upiId = sanitizeUpiId(upiModalVpa?.value) || pendingTopup.upiId;
    }

    renderUpiModal();
    setUpiModalStatus(`${pendingTopup.source} selected. Complete payment in the app, then confirm here.`);
  });
});

if (upiModalVpa) {
  upiModalVpa.addEventListener("input", () => {
    if (!pendingTopup) {
      return;
    }

    pendingTopup.upiId = sanitizeUpiId(upiModalVpa.value);
  });
}

upiCloseButtons.forEach((button) => {
  button.addEventListener("click", closeUpiModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && upiModal && !upiModal.hidden) {
    closeUpiModal();
  }
});

if (upiConfirmButton) {
  upiConfirmButton.addEventListener("click", async () => {
    if (!walletTopupForm || !pendingTopup) {
      return;
    }

    const upiId = sanitizeUpiId(upiModalVpa?.value);

    if (!isValidUpiId(upiId)) {
      setUpiModalStatus("Enter a valid UPI ID such as yourname@okbank.", true);
      return;
    }

    upiConfirmButton.disabled = true;
    setUpiModalStatus(`Waiting for ${pendingTopup.source} confirmation...`);
    setTopupStatus("Processing UPI payment and crediting wallet...");

    try {
      const result = await processWalletTopup({
        amount: pendingTopup.amount,
        source: `${pendingTopup.source} (${upiId})`,
      });

      state.wallet = result.wallet;
      renderWallet();
      renderCart();
      closeUpiModal();
      setTopupStatus(`UPI payment successful. ${result.message}`);
      walletTopupForm.reset();
      walletTopupForm.elements.amount.value = "1000";
      walletTopupForm.elements.source.value = "Google Pay";
      pendingTopup = null;
    } catch (error) {
      setUpiModalStatus(error.message || "Unable to confirm the UPI payment right now.", true);
      setTopupStatus(error.message || "Unable to top up the wallet right now.", true);
    } finally {
      upiConfirmButton.disabled = false;
    }
  });
}

document.addEventListener("click", (event) => {
  const addToCartButton = event.target.closest("[data-add-to-cart]");

  if (!addToCartButton) {
    return;
  }

  const productId = addToCartButton.dataset.productId;
  const product = state.products.get(productId);

  if (!product) {
    setCheckoutStatus("Products are still loading. Please try again in a moment.", true);
    return;
  }

  updateCart(productId);
  setCheckoutStatus(`${product.name} added to cart.`);
});

if (cartItems) {
  cartItems.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-item]");

    if (!removeButton) {
      return;
    }

    removeCartItem(removeButton.dataset.removeItem);
    setCheckoutStatus("Item removed from cart.");
  });
}

if (tokenRedeemInput) {
  tokenRedeemInput.addEventListener("input", () => {
    renderCart();
  });
}

if (checkoutButton) {
  checkoutButton.addEventListener("click", async () => {
    const items = state.cart.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    }));
    const pricing = getCheckoutPricing();

    if (!items.length) {
      setCheckoutStatus("Your cart is empty.", true);
      return;
    }

    checkoutButton.disabled = true;
    setCheckoutStatus("Processing wallet payment...");

    try {
      const result = await processWalletCheckout({
        items,
        tokensToRedeem: pricing.tokensApplied,
      });

      state.wallet = result.wallet;
      state.cart = [];
      if (tokenRedeemInput) {
        tokenRedeemInput.value = "0";
      }
      saveCart();
      renderWallet();
      renderCart();
      setCheckoutStatus(
        `${result.message} Paid ${formatCurrency(result.order.total)} after using ${formatTokens(
          result.order.tokensRedeemed
        )}.`
      );
    } catch (error) {
      setCheckoutStatus(error.message || "Unable to complete wallet payment.", true);
    } finally {
      checkoutButton.disabled = state.cart.length === 0;
    }
  });
}

if (cartButton && cartPanel) {
  cartButton.addEventListener("click", () => {
    cartPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
} else if (cartButton) {
  cartButton.addEventListener("click", () => {
    window.location.href = "index.html#wallet";
  });
}

if (franchiseForm && franchiseFormStatus) {
  franchiseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = franchiseForm.querySelector('button[type="submit"]');
    const formData = new FormData(franchiseForm);
    const payload = Object.fromEntries(formData.entries());

    franchiseFormStatus.textContent = "Submitting your franchise request...";

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const result = await submitFranchiseLead(payload);

      franchiseForm.reset();
      franchiseFormStatus.textContent =
        result.message || "Thanks. Your lead has been captured and verified for the sales team.";
    } catch (error) {
      franchiseFormStatus.textContent =
        error.message || "Something went wrong while submitting the form.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

if (evaAgentForm && evaAgentFormStatus) {
  evaAgentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = evaAgentForm.querySelector('button[type="submit"]');
    const formData = new FormData(evaAgentForm);
    const payload = Object.fromEntries(formData.entries());

    evaAgentFormStatus.textContent = "Submitting your Eva AI Agent application...";

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const result = await submitEvaAgentApplication(payload);

      evaAgentForm.reset();
      const preOption = evaAgentForm.querySelector('input[name="agentType"][value="Pre"]');

      if (preOption) {
        preOption.checked = true;
      }

      evaAgentFormStatus.textContent =
        result.message || "Thanks. Your Eva AI Agent application has been captured.";
    } catch (error) {
      evaAgentFormStatus.textContent =
        error.message || "Something went wrong while submitting the application.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

hydrateStorefront().catch((error) => {
  updateCartCount();
  renderCart();
  renderWallet();
  setTopupStatus("Wallet demo could not be initialized in this browser.", true);
  setCheckoutStatus(error.message || "Storefront data could not be loaded.", true);
});

setupLaunchSlider();

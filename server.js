const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const LEADS_FILE = path.join(DATA_DIR, "franchise-leads.json");
const EVA_AGENT_FILE = path.join(DATA_DIR, "eva-agent-applications.json");
const WALLET_FILE = path.join(DATA_DIR, "wallet.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
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

app.use(express.json());
app.use(express.static(__dirname));

function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber || "").replace(/[^\d+]/g, "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function parseCurrencyAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount);
}

async function ensureDataFile(filePath, defaultValue) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

async function readJson(filePath, defaultValue) {
  await ensureDataFile(filePath, defaultValue);
  const fileContents = await fs.readFile(filePath, "utf8");
  return JSON.parse(fileContents);
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function readWallet() {
  const wallet = await readJson(WALLET_FILE, DEFAULT_WALLET);

  return {
    ...DEFAULT_WALLET,
    ...wallet,
    rewardRules: {
      ...DEFAULT_WALLET.rewardRules,
      ...(wallet.rewardRules || {}),
    },
    transactions: Array.isArray(wallet.transactions) ? wallet.transactions : [],
  };
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
    return "Invalid OTP code. Use 123456 for this starter backend.";
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

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "ll-beauty-backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/products", async (_request, response, next) => {
  try {
    const products = await readJson(PRODUCTS_FILE, []);
    response.json(products);
  } catch (error) {
    next(error);
  }
});

app.get("/api/wallet", async (_request, response, next) => {
  try {
    const wallet = await readWallet();
    response.json(wallet);
  } catch (error) {
    next(error);
  }
});

app.post("/api/wallet/top-up", async (request, response, next) => {
  try {
    const amount = parseCurrencyAmount(request.body.amount);
    const source = String(request.body.source || "bank account").trim();

    if (!amount || amount < 100) {
      return response.status(400).json({
        message: "Top-up amount must be at least ₹100.",
      });
    }

    const wallet = await readWallet();
    const updatedWallet = {
      ...wallet,
      balance: wallet.balance + amount,
      transactions: [
        {
          id: `txn_${Date.now()}`,
          type: "top_up",
          amount,
          source,
          createdAt: new Date().toISOString(),
        },
        ...(wallet.transactions || []),
      ].slice(0, 12),
    };

    await writeJson(WALLET_FILE, updatedWallet);

    response.status(201).json({
      message: `₹${amount} added to wallet from ${source}.`,
      wallet: updatedWallet,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/wallet/checkout", async (request, response, next) => {
  try {
    const products = await readJson(PRODUCTS_FILE, []);
    const wallet = await readWallet();
    const orders = await readJson(ORDERS_FILE, []);
    const cartItems = Array.isArray(request.body.items) ? request.body.items : [];
    const requestedTokens = parseCurrencyAmount(request.body.tokensToRedeem ?? 0);
    const safeRequestedTokens = requestedTokens === null ? null : Math.max(0, requestedTokens);

    if (!cartItems.length) {
      return response.status(400).json({
        message: "Your cart is empty.",
      });
    }

    if (safeRequestedTokens === null) {
      return response.status(400).json({
        message: "Tokens to redeem must be a valid number.",
      });
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const normalizedItems = [];
    let total = 0;

    for (const item of cartItems) {
      const product = productMap.get(String(item.id || "").trim());
      const quantity = parseCurrencyAmount(item.quantity);

      if (!product || !quantity || quantity < 1) {
        return response.status(400).json({
          message: "Cart contains an invalid product or quantity.",
        });
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

    const tokenValue = Math.max(1, parseCurrencyAmount(wallet.rewardRules?.tokenValue) || 1);
    const maxRedeemableTokens = Math.min(
      wallet.rewardTokens || 0,
      Math.floor(total / tokenValue)
    );
    const tokensRedeemed = Math.min(safeRequestedTokens, maxRedeemableTokens);
    const tokenDiscount = tokensRedeemed * tokenValue;
    const payableTotal = total - tokenDiscount;
    const earnedTokens = Math.floor(payableTotal * (wallet.rewardRules?.earnRate || 0));

    if (wallet.balance < payableTotal) {
      return response.status(400).json({
        message: `Insufficient wallet balance. Add ₹${payableTotal - wallet.balance} more to continue.`,
        wallet,
      });
    }

    const order = {
      id: `order_${Date.now()}`,
      items: normalizedItems,
      subtotal: total,
      tokensRedeemed,
      tokenDiscount,
      total: payableTotal,
      earnedTokens,
      currency: wallet.currency || "INR",
      paymentMethod: "wallet",
      createdAt: new Date().toISOString(),
    };

    const walletTransactions = [];

    if (tokensRedeemed > 0) {
      walletTransactions.push({
        id: `txn_${Date.now()}_redeem`,
        type: "reward_redeemed",
        amount: tokensRedeemed,
        value: tokenDiscount,
        orderId: order.id,
        createdAt: new Date().toISOString(),
      });
    }

    walletTransactions.push({
      id: `txn_${Date.now()}_purchase`,
      type: "purchase",
      amount: payableTotal,
      orderId: order.id,
      createdAt: new Date().toISOString(),
    });

    if (earnedTokens > 0) {
      walletTransactions.push({
        id: `txn_${Date.now()}_reward`,
        type: "reward_earned",
        amount: earnedTokens,
        orderId: order.id,
        createdAt: new Date().toISOString(),
      });
    }

    const updatedWallet = {
      ...wallet,
      balance: wallet.balance - payableTotal,
      rewardTokens: (wallet.rewardTokens || 0) - tokensRedeemed + earnedTokens,
      transactions: [...walletTransactions.reverse(), ...(wallet.transactions || [])].slice(0, 20),
    };

    orders.unshift(order);

    await writeJson(WALLET_FILE, updatedWallet);
    await writeJson(ORDERS_FILE, orders);

    response.status(201).json({
      message:
        earnedTokens > 0
          ? `Payment successful. Order ${order.id} confirmed and ${earnedTokens} tokens earned.`
          : `Payment successful. Order ${order.id} confirmed.`,
      order,
      wallet: updatedWallet,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/franchise-leads", async (request, response, next) => {
  try {
    const validationError = validateLead(request.body);

    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    const leads = await readJson(LEADS_FILE, []);
    const normalizedMobile = normalizePhoneNumber(request.body.mobile);

    const lead = {
      id: `lead_${Date.now()}`,
      name: String(request.body.name).trim(),
      mobile: normalizedMobile,
      email: String(request.body.email).trim().toLowerCase(),
      city: String(request.body.city).trim(),
      franchiseFormat: String(request.body.franchiseFormat).trim(),
      preferredLocation: String(request.body.preferredLocation).trim(),
      areaAvailable: String(request.body.areaAvailable).trim(),
      investmentBudget: String(request.body.investmentBudget).trim(),
      otpVerified: true,
      source: "website",
      createdAt: new Date().toISOString(),
    };

    leads.unshift(lead);
    await writeJson(LEADS_FILE, leads);

    return response.status(201).json({
      message: "Franchise lead submitted successfully.",
      lead,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/eva-agent-applications", async (request, response, next) => {
  try {
    const validationError = validateEvaAgentApplication(request.body);

    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    const applications = await readJson(EVA_AGENT_FILE, []);

    const application = {
      id: `eva_agent_${Date.now()}`,
      agentType: String(request.body.agentType).trim(),
      name: String(request.body.name).trim(),
      phone: normalizePhoneNumber(request.body.phone),
      email: String(request.body.email).trim().toLowerCase(),
      aadhaarNumber: String(request.body.aadhaarNumber).trim(),
      panNumber: String(request.body.panNumber).trim().toUpperCase(),
      address: String(request.body.address).trim(),
      shopAddress: String(request.body.shopAddress).trim(),
      source: "website",
      createdAt: new Date().toISOString(),
    };

    applications.unshift(application);
    await writeJson(EVA_AGENT_FILE, applications);

    return response.status(201).json({
      message: "Eva AI Agent application submitted successfully.",
      application,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    message: "Internal server error.",
  });
});

async function startServer() {
  await ensureDataFile(PRODUCTS_FILE, []);
  await ensureDataFile(LEADS_FILE, []);
  await ensureDataFile(EVA_AGENT_FILE, []);
  await ensureDataFile(WALLET_FILE, DEFAULT_WALLET);
  await ensureDataFile(ORDERS_FILE, []);

  app.listen(PORT, () => {
    console.log(`L.L Beauty backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

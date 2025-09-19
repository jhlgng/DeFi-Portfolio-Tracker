import { describe, it, expect, beforeEach } from "vitest";
import { uintCV, stringAsciiCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_TOKEN_LENGTH = 106;
const ERR_INVALID_AMOUNT = 103;
const ERR_NO_ASSETS = 109;
const ERR_ASSET_NOT_FOUND = 104;
const ERR_LIST_FULL = 107;
const ERR_INVALID_PRICE = 108;
const ERR_INVALID_TIMESTAMP = 112;
const ERR_ORACLE_NOT_SET = 120;
const ERR_INVALID_CATEGORY = 117;
const ERR_INVALID_YIELD = 118;
const ERR_INVALID_RISK_SCORE = 119;
const ERR_INVALID_DECIMALS = 111;

interface Asset {
  token: string;
  amount: number;
  decimals: number;
  category: string;
}

interface Price {
  price: number;
  timestamp: number;
  source: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class AssetTrackerMock {
  state: {
    oracleContract: string | null;
    maxAssetsPerUser: number;
    priceUpdateFee: number;
    lastUpdateTimestamp: number;
    admin: string;
    userAssets: Map<string, { assets: Asset[] }>;
    assetPrices: Map<string, Price>;
    assetYields: Map<string, number>;
    userRiskScores: Map<string, number>;
    assetCategories: Map<string, string>;
  } = {
    oracleContract: null,
    maxAssetsPerUser: 50,
    priceUpdateFee: 100,
    lastUpdateTimestamp: 0,
    admin: "ST1ADMIN",
    userAssets: new Map(),
    assetPrices: new Map(),
    assetYields: new Map(),
    userRiskScores: new Map(),
    assetCategories: new Map(),
  };
  caller: string = "ST1USER";
  blockHeight: number = 0;
  stxTransfers: Array<{ amount: number; from: string; to: string }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      oracleContract: null,
      maxAssetsPerUser: 50,
      priceUpdateFee: 100,
      lastUpdateTimestamp: 0,
      admin: "ST1ADMIN",
      userAssets: new Map(),
      assetPrices: new Map(),
      assetYields: new Map(),
      userRiskScores: new Map(),
      assetCategories: new Map(),
    };
    this.caller = "ST1USER";
    this.blockHeight = 0;
    this.stxTransfers = [];
  }

  setOracleContract(contract: string): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: false };
    this.state.oracleContract = contract;
    return { ok: true, value: true };
  }

  setMaxAssets(newMax: number): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: false };
    if (newMax <= 0) return { ok: false, value: false };
    this.state.maxAssetsPerUser = newMax;
    return { ok: true, value: true };
  }

  setPriceUpdateFee(newFee: number): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: false };
    this.state.priceUpdateFee = newFee;
    return { ok: true, value: true };
  }

  addAsset(token: string, amount: number, decimals: number, category: string): Result<boolean> {
    if (token.length === 0 || token.length > 32) return { ok: false, value: false };
    if (amount <= 0) return { ok: false, value: false };
    if (decimals > 18) return { ok: false, value: false };
    if (!["crypto", "stablecoin", "nft"].includes(category)) return { ok: false, value: false };
    let userAssets = this.state.userAssets.get(this.caller) || { assets: [] };
    if (userAssets.assets.length >= this.state.maxAssetsPerUser) return { ok: false, value: false };
    userAssets.assets.push({ token, amount, decimals, category });
    this.state.userAssets.set(this.caller, userAssets);
    return { ok: true, value: true };
  }

  updateAssetBalance(token: string, newAmount: number): Result<boolean> {
    if (token.length === 0 || token.length > 32) return { ok: false, value: false };
    if (newAmount <= 0) return { ok: false, value: false };
    const userAssets = this.state.userAssets.get(this.caller);
    if (!userAssets || userAssets.assets.length === 0) return { ok: false, value: false };
    const asset = userAssets.assets.find(a => a.token === token);
    if (!asset) return { ok: false, value: false };
    asset.amount = newAmount;
    return { ok: true, value: true };
  }

  removeAsset(token: string): Result<boolean> {
    if (token.length === 0 || token.length > 32) return { ok: false, value: false };
    const userAssets = this.state.userAssets.get(this.caller);
    if (!userAssets) return { ok: false, value: false };
    const index = userAssets.assets.findIndex(a => a.token === token);
    if (index === -1) return { ok: false, value: false };
    userAssets.assets.splice(index, 1);
    return { ok: true, value: true };
  }

  updateAssetPrice(token: string, price: number, ts: number): Result<boolean> {
    if (!this.state.oracleContract) return { ok: false, value: false };
    if (this.caller !== this.state.oracleContract) return { ok: false, value: false };
    if (token.length === 0 || token.length > 32) return { ok: false, value: false };
    if (price <= 0) return { ok: false, value: false };
    if (ts <= this.state.lastUpdateTimestamp) return { ok: false, value: false };
    this.stxTransfers.push({ amount: this.state.priceUpdateFee, from: this.caller, to: this.state.admin });
    this.state.assetPrices.set(token, { price, timestamp: ts, source: this.caller });
    this.state.lastUpdateTimestamp = ts;
    return { ok: true, value: true };
  }

  setAssetYield(token: string, yieldRate: number): Result<boolean> {
    if (!this.state.oracleContract) return { ok: false, value: false };
    if (this.caller !== this.state.oracleContract) return { ok: false, value: false };
    if (token.length === 0 || token.length > 32) return { ok: false, value: false };
    if (yieldRate > 10000) return { ok: false, value: false };
    this.state.assetYields.set(token, yieldRate);
    return { ok: true, value: true };
  }

  setUserRiskScore(user: string, score: number): Result<boolean> {
    if (!this.state.oracleContract) return { ok: false, value: false };
    if (this.caller !== this.state.oracleContract) return { ok: false, value: false };
    if (score > 100) return { ok: false, value: false };
    this.state.userRiskScores.set(user, score);
    return { ok: true, value: true };
  }

  setAssetCategory(token: string, category: string): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: false };
    if (token.length === 0 || token.length > 32) return { ok: false, value: false };
    if (!["crypto", "stablecoin", "nft"].includes(category)) return { ok: false, value: false };
    this.state.assetCategories.set(token, category);
    return { ok: true, value: true };
  }

  getUserAssets(user: string): { assets: Asset[] } | null {
    return this.state.userAssets.get(user) || null;
  }

  getAssetPrice(token: string): Price | null {
    return this.state.assetPrices.get(token) || null;
  }

  getPortfolioValue(user: string): number {
    const userAssets = this.state.userAssets.get(user);
    if (!userAssets) return 0;
    return userAssets.assets.reduce((acc, asset) => {
      const price = this.state.assetPrices.get(asset.token)?.price || 0;
      return acc + asset.amount * price;
    }, 0);
  }
}

describe("AssetTracker", () => {
  let contract: AssetTrackerMock;

  beforeEach(() => {
    contract = new AssetTrackerMock();
    contract.reset();
  });

  it("adds asset successfully", () => {
    const result = contract.addAsset("BTC", 10, 8, "crypto");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const assets = contract.getUserAssets("ST1USER")?.assets;
    expect(assets?.[0].token).toBe("BTC");
    expect(assets?.[0].amount).toBe(10);
  });

  it("rejects invalid token length", () => {
    const result = contract.addAsset("", 10, 8, "crypto");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("updates asset balance successfully", () => {
    contract.addAsset("BTC", 10, 8, "crypto");
    const result = contract.updateAssetBalance("BTC", 20);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const assets = contract.getUserAssets("ST1USER")?.assets;
    expect(assets?.[0].amount).toBe(20);
  });

  it("rejects update for non-existent asset", () => {
    const result = contract.updateAssetBalance("ETH", 20);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("removes asset successfully", () => {
    contract.addAsset("BTC", 10, 8, "crypto");
    const result = contract.removeAsset("BTC");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const assets = contract.getUserAssets("ST1USER")?.assets;
    expect(assets?.length).toBe(0);
  });

  it("updates asset price successfully", () => {
    contract.caller = "ST1ADMIN";
    contract.setOracleContract("ST2ORACLE");
    contract.caller = "ST2ORACLE";
    const result = contract.updateAssetPrice("BTC", 50000, 100);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const price = contract.getAssetPrice("BTC");
    expect(price?.price).toBe(50000);
    expect(contract.stxTransfers).toEqual([{ amount: 100, from: "ST2ORACLE", to: "ST1ADMIN" }]);
  });

  it("rejects price update without oracle", () => {
    const result = contract.updateAssetPrice("BTC", 50000, 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("sets asset yield successfully", () => {
    contract.caller = "ST1ADMIN";
    contract.setOracleContract("ST2ORACLE");
    contract.caller = "ST2ORACLE";
    const result = contract.setAssetYield("BTC", 500);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.assetYields.get("BTC")).toBe(500);
  });

  it("sets user risk score successfully", () => {
    contract.caller = "ST1ADMIN";
    contract.setOracleContract("ST2ORACLE");
    contract.caller = "ST2ORACLE";
    const result = contract.setUserRiskScore("ST1USER", 75);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.userRiskScores.get("ST1USER")).toBe(75);
  });

  it("sets asset category successfully", () => {
    contract.caller = "ST1ADMIN";
    const result = contract.setAssetCategory("BTC", "crypto");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.assetCategories.get("BTC")).toBe("crypto");
  });

it("parses asset parameters with Clarity types", () => {
    const token = stringAsciiCV("BTC");
    const amount = uintCV(10);
    expect(token.value).toBe("BTC");
    expect(amount.value).toEqual(BigInt(10));
  });

  it("rejects add asset when list full", () => {
    contract.state.maxAssetsPerUser = 1;
    contract.addAsset("BTC", 10, 8, "crypto");
    const result = contract.addAsset("ETH", 20, 18, "crypto");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = contract.addAsset("BTC", 10, 8, "invalid");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("rejects invalid yield", () => {
    contract.caller = "ST1ADMIN";
    contract.setOracleContract("ST2ORACLE");
    contract.caller = "ST2ORACLE";
    const result = contract.setAssetYield("BTC", 10001);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("rejects invalid risk score", () => {
    contract.caller = "ST1ADMIN";
    contract.setOracleContract("ST2ORACLE");
    contract.caller = "ST2ORACLE";
    const result = contract.setUserRiskScore("ST1USER", 101);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });
});
export type VoucherStatus = "available" | "used" | "expired";

export type Voucher = {
  id: string;
  title: string;
  amount: number;
  code: string;
  issuedAt: string;
  expiresAt: string;
  status: VoucherStatus;
};

export const VOUCHERS: Voucher[] = [
  {
    id: "v1",
    title: "신원시장 상품권",
    amount: 5000,
    code: "SW-5K-8F2A91",
    issuedAt: "2026-10-12",
    expiresAt: "2027-04-12",
    status: "available",
  },
  {
    id: "v2",
    title: "신원시장 상품권",
    amount: 5000,
    code: "SW-5K-3C7D04",
    issuedAt: "2026-09-03",
    expiresAt: "2027-03-03",
    status: "available",
  },
  {
    id: "v3",
    title: "신원시장 상품권",
    amount: 5000,
    code: "SW-5K-9B1E66",
    issuedAt: "2026-08-18",
    expiresAt: "2027-02-18",
    status: "available",
  },
  {
    id: "v4",
    title: "신원시장 상품권",
    amount: 5000,
    code: "SW-5K-1A0C22",
    issuedAt: "2026-07-01",
    expiresAt: "2027-01-01",
    status: "used",
  },
  {
    id: "v5",
    title: "신원시장 상품권",
    amount: 5000,
    code: "SW-5K-6D4F88",
    issuedAt: "2025-11-20",
    expiresAt: "2026-05-20",
    status: "expired",
  },
];

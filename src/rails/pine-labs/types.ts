export interface PaymentRequest {
  amount: number;
  currency: string;
  purpose: string;
}

export type PaymentStatus = "created" | "authorized" | "paid" | "failed";

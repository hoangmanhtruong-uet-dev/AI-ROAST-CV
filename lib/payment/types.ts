export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export interface BankTransferInfo {
  bankId: string; // e.g. 'MB' | 'TCB' | 'VCB'
  bankName: string; // e.g. 'MBBank - Ngân hàng Quân Đội'
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
  qrUrl: string;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  description: string;
  status: PaymentStatus;
  licenseKey: string | null;
  createdAt: number;
  expiresAt: number;
  paidAt?: number;
  transactionReference?: string;
  bankInfo: BankTransferInfo;
}

export interface CreateOrderResponse {
  success: boolean;
  order: PaymentOrder;
  error?: string;
}

export interface OrderStatusResponse {
  success: boolean;
  status: PaymentStatus;
  orderId: string;
  licenseKey?: string | null;
  paidAt?: number;
  error?: string;
}

export interface ActivateKeyResponse {
  success: boolean;
  isPro: boolean;
  licenseKey?: string;
  message: string;
}

// Schema expected from SePay incoming webhook
export interface SePayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount?: string | null;
  code?: string | null;
  content: string;
  transferType: 'in' | 'out';
  transferAmount: number;
  accumulated: number;
  referenceCode?: string;
  description?: string;
}

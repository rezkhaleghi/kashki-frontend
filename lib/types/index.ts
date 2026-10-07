export type ApiMessage = {
  message: string;
};

export type PaymentCurrency = "IRR" | "USD" | "EUR" | "USDT" | "BTC" | "TRX";
export type PaymentProvider = "FAKE_PROVIDER" | "ZARINPAL";

export type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  dateOfBirth: string | null;
  avatar: string | null;
  bio: string | null;
  hideYear: boolean;
};

export type UserBalance = {
  id: string;
  userId: string;
  amount?: string;
  _amount?: string;
  currency: string;
};

export type UserSearchResult = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  avatar: string | null;
  bio: string | null;
  email: string;
  createdAt: string;
};

export type ListVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export type WishStatus = "ACTIVE" | "COMPLETED";

export type PublicWish = {
  id: string;
  title: string;
  description: string | null;
  links?: string[];
  targetAmount: string | null;
  currency: string | null;
  status: WishStatus;
  receivedAmount: string | null;
};

export type PublicList = {
  id: string;
  name: string;
  description: string | null;
  visibility: ListVisibility;
  wishes: PublicWish[];
};

export type PublicUserProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  avatar: string | null;
  bio: string | null;
  birthday: string | null;
  lists: PublicList[];
};

export type CreateListInput = {
  name: string;
  description?: string | null;
  visibility?: ListVisibility;
};

export type ListEntity = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  visibility: ListVisibility;
  createdAt: string;
  updatedAt: string;
};

export type WishEntity = {
  id: string;
  listId: string;
  userId: string;
  title: string;
  description: string | null;
  links: string[];
  targetAmount: string | null;
  currency: string | null;
  status: WishStatus;
  createdAt: string;
  updatedAt: string;
};

export type Gift = {
  id: string;
  userId: string | null;
  recipientUserId: string | null;
  wishId: string | null;
  amount: string;
  currency: string;
  anonymous: boolean;
  message: string | null;
  createdAt: string;
};

export type Deposit = {
  id: string;
  userId: string;
  provider: string;
  currency: string;
  amount: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  referenceId: string;
  providerPaymentId: string | null;
  transactionId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Withdrawal = {
  id: string;
  userId: string;
  currency: string;
  amount: string;
  destination: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  referenceId: string;
  transactionId: string | null;
  completedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: "WITHDRAWAL_APPROVED" | "WITHDRAWAL_REJECTED" | "GIFT_RECEIVED";
  channel: "IN_APP" | "EMAIL" | "SMS" | "TELEGRAM";
  status: "PENDING" | "SENT" | "FAILED";
  title: string;
  message: string;
  referenceId: string | null;
  sentAt: string | null;
  readAt: string | null;
  failureReason: string | null;
  createdAt: string;
};

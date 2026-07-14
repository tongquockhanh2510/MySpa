import axiosInstance from './axiosInstance';

export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'PENDING' | 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUPERSEDED';
export type SubscriptionPaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface SubscriptionPlan {
  planId: string;
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxEmployees: number | null;
  maxAppointmentsPerMonth: number | null;
  features: string[];
  popular: boolean;
}

export interface SpaSubscription {
  subscriptionId: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  activatedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface SubscriptionCheckout {
  subscription: SpaSubscription;
  paymentId: string;
  amount: number;
  memo: string;
  qrUrl: string;
  bankBin: string;
  accountNumber: string;
  accountName: string;
}

export interface SubscriptionPayment {
  paymentId: string;
  subscriptionId: string;
  planName: string;
  amount: number;
  status: SubscriptionPaymentStatus;
  paymentMemo: string;
  transactionReference: string | null;
  createdAt: string;
  paidAt: string | null;
}

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> =>
  (await axiosInstance.get('/subscriptions/plans')).data.result ?? [];

export const getCurrentSubscription = async (): Promise<SpaSubscription | null> =>
  (await axiosInstance.get('/subscriptions/current')).data.result ?? null;

export const getSubscriptionPayments = async (): Promise<SubscriptionPayment[]> =>
  (await axiosInstance.get('/subscriptions/payments')).data.result ?? [];

export const createSubscriptionCheckout = async (planCode: string, billingCycle: BillingCycle): Promise<SubscriptionCheckout> =>
  (await axiosInstance.post('/subscriptions/checkout', { planCode, billingCycle })).data.result;

export const cancelSubscription = async (): Promise<SpaSubscription> =>
  (await axiosInstance.post('/subscriptions/cancel')).data.result;

export const resumeSubscription = async (): Promise<SpaSubscription> =>
  (await axiosInstance.post('/subscriptions/resume')).data.result;

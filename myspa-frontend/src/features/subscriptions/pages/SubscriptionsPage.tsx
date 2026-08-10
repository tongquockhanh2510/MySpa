import { useCallback, useEffect, useState } from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import { toast } from 'sonner';
import {
  cancelSubscription,
  createSubscriptionCheckout,
  getCurrentSubscription,
  getSubscriptionPayments,
  getSubscriptionPlans,
  resumeSubscription,
  type BillingCycle,
  type SpaSubscription,
  type SubscriptionCheckout,
  type SubscriptionPayment,
  type SubscriptionPlan,
} from '@/api/subscriptions';
import { useIsMobile } from '@hooks/useIsMobile';
import './SubscriptionsPage.css';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const date = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : '—';

const paymentStatusLabel = (status: string) => (status === 'SUCCESS' ? 'Thành công' : status === 'PENDING' ? 'Chờ thanh toán' : status);

const SubscriptionsPage = () => {
  const isMobile = useIsMobile();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [current, setCurrent] = useState<SpaSubscription | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');
  const [checkout, setCheckout] = useState<SubscriptionCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    try {
      const [planData, currentData, paymentData] = await Promise.all([
        getSubscriptionPlans(), getCurrentSubscription(), getSubscriptionPayments(),
      ]);
      setPlans(planData);
      setCurrent(currentData);
      setPayments(paymentData);
      if (checkout && currentData?.status === 'ACTIVE' && currentData.subscriptionId === checkout.subscription.subscriptionId) {
        setCheckout(null);
        toast.success('Thanh toán thành công. Gói dịch vụ đã được kích hoạt!');
      }
    } catch {
      if (!quiet) toast.error('Không thể tải thông tin gói dịch vụ');
    } finally {
      setLoading(false);
    }
  }, [checkout]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!checkout) return;
    const timer = window.setInterval(() => void load(true), 5000);
    return () => window.clearInterval(timer);
  }, [checkout, load]);

  const choosePlan = async (plan: SubscriptionPlan) => {
    setSubmitting(plan.code);
    try {
      setCheckout(await createSubscriptionCheckout(plan.code, cycle));
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Không thể tạo yêu cầu đăng ký');
    } finally {
      setSubmitting(null);
    }
  };

  const updateRenewal = async (resume: boolean) => {
    try {
      setCurrent(resume ? await resumeSubscription() : await cancelSubscription());
      toast.success(resume ? 'Đã bật lại gia hạn' : 'Đã ngừng gia hạn vào cuối chu kỳ');
    } catch {
      toast.error('Không thể cập nhật gia hạn');
    }
  };

  if (loading) return <div className="subscription-loading">Đang tải gói dịch vụ...</div>;

  return (
    <div className="subscription-page">
      <section className="subscription-hero">
        <div>
          <span className="subscription-eyebrow"><WorkspacePremiumRoundedIcon /> MY SPA SUBSCRIPTION</span>
          <h1>Gói dịch vụ dành cho spa</h1>
          <p>Chọn quy mô phù hợp và nâng cấp bất cứ lúc nào. Thanh toán an toàn qua chuyển khoản VietQR.</p>
        </div>
        <div className="cycle-switch" role="group" aria-label="Chu kỳ thanh toán">
          <button className={cycle === 'MONTHLY' ? 'active' : ''} onClick={() => setCycle('MONTHLY')}>Theo tháng</button>
          <button className={cycle === 'YEARLY' ? 'active' : ''} onClick={() => setCycle('YEARLY')}>Theo năm <span>Tiết kiệm 2 tháng</span></button>
        </div>
      </section>

      {current && (
        <section className="current-subscription">
          <div className="current-icon"><WorkspacePremiumRoundedIcon /></div>
          <div className="current-main">
            <span>Gói đang sử dụng</span>
            <h2>{current.plan.name}</h2>
            <p>{current.cancelAtPeriodEnd ? `Sẽ kết thúc vào ${date(current.currentPeriodEnd)}` : `Gia hạn tiếp theo: ${date(current.currentPeriodEnd)}`}</p>
          </div>
          <span className={`subscription-status ${current.status.toLowerCase()}`}>{current.status === 'ACTIVE' ? 'Đang hoạt động' : current.status}</span>
          {current.cancelAtPeriodEnd ? (
            <button className="secondary-button" onClick={() => void updateRenewal(true)}><AutorenewRoundedIcon /> Bật lại gia hạn</button>
          ) : (
            <button className="text-button danger" onClick={() => void updateRenewal(false)}>Ngừng gia hạn</button>
          )}
        </section>
      )}

      <section className="plan-grid">
        {plans.map((plan) => {
          const price = cycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;
          const selected = current?.plan.code === plan.code && current.billingCycle === cycle;
          return (
            <article className={`plan-card ${plan.popular ? 'popular' : ''}`} key={plan.planId}>
              {plan.popular && <div className="popular-label">Được lựa chọn nhiều nhất</div>}
              <div className="plan-card-head"><h2>{plan.name}</h2><p>{plan.description}</p></div>
              <div className="plan-price"><strong>{money.format(price)}</strong><span>/{cycle === 'YEARLY' ? 'năm' : 'tháng'}</span></div>
              {cycle === 'YEARLY' && <div className="monthly-equivalent">Chỉ {money.format(Math.round(price / 12))}/tháng</div>}
              <div className="plan-limits">
                <span>{plan.maxEmployees ?? 'Không giới hạn'} nhân viên</span>
                <span>{plan.maxAppointmentsPerMonth ?? 'Không giới hạn'} lịch hẹn/tháng</span>
              </div>
              <ul>{plan.features.map(feature => <li key={feature}><CheckCircleRoundedIcon /> {feature}</li>)}</ul>
              <button className="choose-button" disabled={selected || submitting !== null} onClick={() => void choosePlan(plan)}>
                {selected ? 'Gói hiện tại' : submitting === plan.code ? 'Đang tạo thanh toán...' : current ? 'Chuyển sang gói này' : 'Đăng ký ngay'}
              </button>
            </article>
          );
        })}
      </section>

      <section className="payment-history">
        <div className="section-heading"><div><h2>Lịch sử thanh toán</h2><p>Theo dõi các giao dịch mua gói của spa</p></div></div>
        {payments.length === 0 ? <div className="empty-payments">Chưa có giao dịch nào.</div> : isMobile ? (
          <div className="payment-list-mobile">
            {payments.map(payment => (
              <div className="payment-card" key={payment.paymentId}>
                <div className="payment-card__top">
                  <strong>{payment.planName}</strong>
                  <span className={`payment-status ${payment.status.toLowerCase()}`}>{paymentStatusLabel(payment.status)}</span>
                </div>
                <div className="payment-card__row"><span>Mã thanh toán</span><code>{payment.paymentMemo}</code></div>
                <div className="payment-card__row"><span>Ngày tạo</span><span>{date(payment.createdAt)}</span></div>
                <div className="payment-card__row payment-card__row--amount"><span>Số tiền</span><strong>{money.format(payment.amount)}</strong></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="payment-table-wrap"><table><thead><tr><th>Gói</th><th>Mã thanh toán</th><th>Ngày tạo</th><th>Số tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>{payments.map(payment => <tr key={payment.paymentId}><td>{payment.planName}</td><td><code>{payment.paymentMemo}</code></td><td>{date(payment.createdAt)}</td><td>{money.format(payment.amount)}</td><td><span className={`payment-status ${payment.status.toLowerCase()}`}>{paymentStatusLabel(payment.status)}</span></td></tr>)}</tbody>
          </table></div>
        )}
      </section>

      {checkout && (
        <div className="qr-backdrop" role="dialog" aria-modal="true">
          <div className="qr-dialog">
            <button className="qr-close" aria-label="Đóng" onClick={() => { setCheckout(null); void load(true); }}><CloseRoundedIcon /></button>
            <h2>Quét mã để thanh toán</h2>
            <p>Gói <strong>{checkout.subscription.plan.name}</strong> · {cycle === 'YEARLY' ? 'Theo năm' : 'Theo tháng'}</p>
            <img src={checkout.qrUrl} alt="Mã VietQR thanh toán gói dịch vụ" />
            <div className="qr-amount">{money.format(checkout.amount)}</div>
            <div className="bank-details"><div><span>Chủ tài khoản</span><strong>{checkout.accountName}</strong></div><div><span>Số tài khoản</span><strong>{checkout.accountNumber}</strong></div><div><span>Nội dung bắt buộc</span><code>{checkout.memo}</code></div></div>
            <div className="waiting-payment"><span></span> Đang chờ xác nhận thanh toán tự động...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;

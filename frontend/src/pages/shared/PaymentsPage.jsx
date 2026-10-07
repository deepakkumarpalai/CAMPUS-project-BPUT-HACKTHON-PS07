import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync';
import { paymentService } from '../../services/paymentService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Modal from '../../components/Modal.jsx';
import { formatDate, formatDateTime } from '../../utils/format.js';

const currency = (paise) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
}).format((paise || 0) / 100);

const loadCheckoutScript = () => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = resolve;
  script.onerror = () => reject(new Error('Could not load Razorpay checkout. Check your internet connection.'));
  document.body.appendChild(script);
});

const emptyFee = { studentId: '', courseName: '', academicYear: '', totalFee: '', dueDate: '' };

export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data, loading, error, reload } = useAsync(async () => {
    const [fees, payments, students] = await Promise.all([
      paymentService.fees(),
      paymentService.history(),
      isAdmin ? userService.list({ role: 'STUDENT' }) : Promise.resolve({ data: { data: [] } })
    ]);
    return { fees: fees.data.data, payments: payments.data.data, students: students.data.data };
  }, [isAdmin]);
  const { push } = useToast();
  const [feeOpen, setFeeOpen] = useState(false);
  const [feeForm, setFeeForm] = useState(emptyFee);
  const [payingId, setPayingId] = useState('');

  const saveFee = async (e) => {
    e.preventDefault();
    try {
      await paymentService.setFee(feeForm);
      push('Course fee saved', 'success');
      setFeeOpen(false);
      setFeeForm(emptyFee);
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not save course fee', 'error');
    }
  };

  const payFee = async (feeAccount) => {
    setPayingId(feeAccount._id);
    try {
      await loadCheckoutScript();
      const { data: orderResponse } = await paymentService.createOrder(feeAccount._id);
      const order = orderResponse.data;
      let paymentCompleted = false;
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Smart Campus',
        description: `${feeAccount.courseName} course fee`,
        order_id: order.orderId,
        prefill: { name: user.name, email: user.email, contact: user.phone || '' },
        theme: { color: '#1d4ed8' },
        handler: async (response) => {
          paymentCompleted = true;
          try {
            await paymentService.verify(response);
            push('Payment confirmed and fee balance updated', 'success');
            reload();
          } catch (err) {
            push(err.userMessage || 'Payment verification failed. Contact the campus administrator.', 'error');
            reload();
          } finally {
            setPayingId('');
          }
        },
        modal: {
          ondismiss: async () => {
            if (!paymentCompleted) {
              try {
                await paymentService.cancelOrder(order.orderId);
              } catch (err) {
                push(err.userMessage || 'Could not close payment checkout', 'error');
              } finally {
                setPayingId('');
                reload();
              }
            }
          }
        }
      });
      checkout.on('payment.failed', (response) => {
        push(response.error?.description || 'Razorpay could not complete the payment', 'error');
      });
      checkout.open();
    } catch (err) {
      push(err.userMessage || err.message || 'Could not start payment', 'error');
      setPayingId('');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Course Fees & Payments</h1>
          <p className="text-sm text-slate-500">Razorpay test mode · no live charges are made</p>
        </div>
        {isAdmin && <button className="btn-primary" type="button" onClick={() => setFeeOpen(true)}>Set student course fee</button>}
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Course fee balances</h2>
        {!data.fees.length ? <div className="card text-slate-500">{isAdmin ? 'No course fees have been assigned.' : 'No course fees have been assigned to your account yet.'}</div> : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.fees.map((fee) => {
              const remaining = fee.totalFeePaise - fee.paidFeePaise;
              return (
                <article className="card" key={fee._id}>
                  <p className="text-xs font-semibold uppercase text-blue-700">{fee.academicYear}</p>
                  <h3 className="mt-1 font-semibold">{fee.courseName}</h3>
                  {isAdmin && <p className="text-sm text-slate-500">{fee.user?.name} · {fee.user?.studentId || fee.user?.email}</p>}
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-slate-500">Total course fee</dt><dd className="text-right font-medium">{currency(fee.totalFeePaise)}</dd>
                    <dt className="text-slate-500">Paid</dt><dd className="text-right font-medium">{currency(fee.paidFeePaise)}</dd>
                    <dt className="text-slate-500">Remaining</dt><dd className="text-right font-semibold text-amber-700">{currency(remaining)}</dd>
                  </dl>
                  {fee.dueDate && <p className="mt-2 text-xs text-slate-500">Due date: {formatDate(fee.dueDate)}</p>}
                  {!isAdmin && remaining > 0 && <button className="btn-primary mt-4 w-full" disabled={payingId === fee._id} type="button" onClick={() => payFee(fee)}>{payingId === fee._id ? 'Opening secure checkout…' : `Pay ${currency(remaining)}`}</button>}
                  {remaining === 0 && <p className="mt-4 text-sm font-medium text-green-700">Paid in full</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Payment history</h2>
        {!data.payments.length ? <div className="card text-slate-500">No payments recorded yet.</div> : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
                {isAdmin && <th className="px-4 py-3">Student</th>}
                <th className="px-4 py-3">Course</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th>
              </tr></thead>
              <tbody>{data.payments.map((payment) => <tr className="border-t border-slate-100" key={payment._id}>
                {isAdmin && <td className="px-4 py-3">{payment.user?.name || '—'}</td>}
                <td className="px-4 py-3">{payment.feeAccount?.courseName || 'Course fee'}</td>
                <td className="px-4 py-3">{currency(payment.amountPaise)}</td>
                <td className="px-4 py-3">{payment.method || '—'}</td>
                <td className="px-4 py-3">{payment.status}</td>
                <td className="px-4 py-3">{formatDateTime(payment.paidAt || payment.createdAt)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={feeOpen} title="Set course fee for a student" onClose={() => setFeeOpen(false)}>
        <form onSubmit={saveFee} className="space-y-3">
          <div><label>Student</label><select required value={feeForm.studentId} onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })}><option value="">Select a student</option>{data.students.map((student) => <option key={student._id} value={student._id}>{student.name} · {student.studentId || student.email}</option>)}</select></div>
          <div><label>Course</label><input required value={feeForm.courseName} onChange={(e) => setFeeForm({ ...feeForm, courseName: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label>Academic year</label><input required placeholder="2026-27" value={feeForm.academicYear} onChange={(e) => setFeeForm({ ...feeForm, academicYear: e.target.value })} /></div>
            <div><label>Total fee (INR)</label><input required type="number" min="0.01" step="0.01" value={feeForm.totalFee} onChange={(e) => setFeeForm({ ...feeForm, totalFee: e.target.value })} /></div>
          </div>
          <div><label>Due date (optional)</label><input type="date" value={feeForm.dueDate} onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })} /></div>
          <button className="btn-primary" type="submit">Save fee</button>
        </form>
      </Modal>
    </div>
  );
}

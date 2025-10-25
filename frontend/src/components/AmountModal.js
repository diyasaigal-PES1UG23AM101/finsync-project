// frontend/src/components/AmountModal.js
import React, { useState, useEffect } from 'react';

const AmountModal = ({ open, onClose, onConfirm, payeeName }) => {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (open) setAmount('');
  }, [open]);

  const confirm = () => {
    const val = amount.trim();
    if (!val) { alert('Enter amount'); return; }
    const num = Number(val);
    if (!isFinite(num) || num <= 0) { alert('Enter a valid amount'); return; }
    onConfirm(num.toFixed(2)); // pass as string with 2 decimals, GPay accepts "1.00"
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b">
          <h3 className="text-xl font-bold">Enter Amount</h3>
          {payeeName ? (
            <p className="text-sm text-gray-600 mt-1">Payee: <b>{payeeName}</b></p>
          ) : null}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">₹</span>
            <input
              autoFocus
              inputMode="decimal"
              pattern="[0-9]*"
              placeholder="0.00"
              className="flex-1 border rounded-xl p-3 text-lg outline-none focus:ring-2 focus:ring-purple-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            />
          </div>

          <button
            onClick={confirm}
            className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold active:scale-95 transition"
          >
            Continue to Google Pay
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-900 font-semibold active:scale-95 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmountModal;

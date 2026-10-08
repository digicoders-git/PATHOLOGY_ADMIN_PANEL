import React, { useState } from "react";
import { MdAccountBalanceWallet, MdClose, MdCheckCircle, MdCardGiftcard } from "react-icons/md";
import { creditLabWallet } from "../apis/registration";
import { toast } from "react-toastify";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const CREDIT_TYPES = [
  "Offer Points",
  "Coupon Points",
  "Welcome Bonus",
  "Festival Bonus",
  "Promotional Credit",
  "Custom Bonus"
];

const CreditWalletModal = ({ isOpen, onClose, lab, onSuccess }) => {
  const [amount, setAmount] = useState(100);
  const [type, setType] = useState("Offer Points");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !lab) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setLoading(true);
      const res = await creditLabWallet({
        labId: lab._id,
        amount: numAmount,
        type,
        description: description.trim() || `${type} credited by admin`,
      });

      if (res.success) {
        toast.success(res.message || `Successfully credited ₹${numAmount} to ${lab.labName}!`);
        if (onSuccess) {
          onSuccess(lab._id, res.data.newBalance);
        }
        onClose();
      } else {
        toast.error(res.message || "Failed to credit points");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to credit points");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
          >
            <MdClose size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <MdAccountBalanceWallet size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-tight">
                Credit Wallet Points
              </h3>
              <p className="text-xs text-white/80 font-medium">
                Add offer, coupon, or bonus points to lab
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">
                Laboratory
              </span>
              <span className="text-sm font-bold truncate max-w-[220px] block">
                {lab.labName || "Lab"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">
                Current Balance
              </span>
              <span className="text-base font-black text-amber-200">
                ₹{lab.walletBalance || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount / Points */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Points / Amount to Credit (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xl text-slate-800 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>

            {/* Quick Pick Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    Number(amount) === val
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  +₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Type of Points */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Offer / Point Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-red-500 focus:bg-white transition-all"
            >
              {CREDIT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Description / Reason */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Reason / Note (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Festival Special Offer, Weekly Promotion"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-red-500 focus:bg-white transition-all"
            />
          </div>

          {/* Calculation Preview */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <MdCheckCircle className="text-emerald-600" size={16} /> New Balance After Credit:
            </span>
            <span className="font-black text-emerald-900 text-sm">
              ₹{(Number(lab.walletBalance) || 0) + (Number(amount) || 0)}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <MdCardGiftcard size={16} />
                  Credit Points
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditWalletModal;

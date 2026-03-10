'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { CheckCircle2, Receipt } from 'lucide-react';

export default function FinancialsForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        beneficiary_name: '',
        category: 'Paid',
        op_invoice: '',
        amount_paid: '',
        pharmacy_amount: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const payload = {
                ...formData,
                op_invoice: parseFloat(formData.op_invoice) || 0,
                amount_paid: parseFloat(formData.amount_paid) || 0,
                pharmacy_amount: parseFloat(formData.pharmacy_amount) || 0,
                user_id: user.id
            };

            const { error } = await supabase.from('financials').insert([payload]);

            if (error) throw error;
            setSuccess(true);
            window.scrollTo(0, 0);

            setFormData(prev => ({
                ...prev, beneficiary_name: '', op_invoice: '', amount_paid: '', pharmacy_amount: ''
            }));
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // Calculate live total
    const op = parseFloat(formData.op_invoice) || 0;
    const pay = parseFloat(formData.amount_paid) || 0;
    const pharm = parseFloat(formData.pharmacy_amount) || 0;
    const liveTotal = op + pay + pharm;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-teal-900 px-8 py-6 text-white flex items-center space-x-4">
                    <div className="p-3 bg-teal-800 rounded-xl">
                        <Receipt className="w-8 h-8 text-teal-100" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Monthly Financials</h1>
                        <p className="text-teal-100 text-sm mt-1">Log revenue generated through admissions/pharmacy.</p>
                    </div>
                </div>

                <div className="p-8">
                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center space-x-3">
                            <CheckCircle2 className="w-6 h-6 shrink-0" />
                            <p className="font-medium">Success! Financial record has been saved.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="form-label">Date</label>
                                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="form-input" />
                            </div>

                            <div>
                                <label className="form-label">Beneficiary Name</label>
                                <input type="text" name="beneficiary_name" required value={formData.beneficiary_name} onChange={handleChange} className="form-input" placeholder="Patient's Name" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="form-label">Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="form-input">
                                    <option value="Paid">Paid (Cash / Card)</option>
                                    <option value="Insurance">Insurance / TPA</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">OP Invoice Amount (Rs.)</label>
                                <input type="number" step="0.01" name="op_invoice" value={formData.op_invoice} onChange={handleChange} className="form-input" placeholder="0.00" />
                            </div>

                            <div>
                                <label className="form-label">IP Amount Paid (Rs.)</label>
                                <input type="number" step="0.01" name="amount_paid" value={formData.amount_paid} onChange={handleChange} className="form-input" placeholder="0.00" />
                            </div>

                            <div>
                                <label className="form-label">Pharmacy Amount (Rs.)</label>
                                <input type="number" step="0.01" name="pharmacy_amount" value={formData.pharmacy_amount} onChange={handleChange} className="form-input" placeholder="0.00" />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-center items-center">
                                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Revenue</span>
                                <span className="text-2xl font-bold text-teal-700">₹ {liveTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary !py-3 text-lg mt-6">
                            {loading ? 'Submitting Financials...' : 'Submit Financial Record'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { CheckCircle2, HeartHandshake } from 'lucide-react';

export default function CampConversionsForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        camp_date: new Date().toISOString().split('T')[0],
        place: '',
        beneficiary_name: '',
        treatment: '',
        category: 'OP',
        amount_paid: '',
        remarks: ''
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
                amount_paid: parseFloat(formData.amount_paid) || 0,
                user_id: user.id
            };

            const { error } = await supabase.from('camp_conversions').insert([payload]);

            if (error) throw error;
            setSuccess(true);
            window.scrollTo(0, 0);

            setFormData(prev => ({
                ...prev, place: '', beneficiary_name: '', treatment: '', amount_paid: '', remarks: ''
            }));
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-teal-900 px-8 py-6 text-white flex items-center space-x-4">
                    <div className="p-3 bg-teal-800 rounded-xl">
                        <HeartHandshake className="w-8 h-8 text-teal-100" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Camp Conversions</h1>
                        <p className="text-teal-100 text-sm mt-1">Log patients converted from camps to OP/IP treatments.</p>
                    </div>
                </div>

                <div className="p-8">
                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center space-x-3">
                            <CheckCircle2 className="w-6 h-6 shrink-0" />
                            <p className="font-medium">Success! Your conversion record has been saved.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="form-label">Camp Date</label>
                                <input type="date" name="camp_date" required value={formData.camp_date} onChange={handleChange} className="form-input" />
                            </div>

                            <div>
                                <label className="form-label">Camp Place</label>
                                <input type="text" name="place" required value={formData.place} onChange={handleChange} className="form-input" placeholder="Location of camp" />
                            </div>

                            <div>
                                <label className="form-label">Beneficiary Name</label>
                                <input type="text" name="beneficiary_name" required value={formData.beneficiary_name} onChange={handleChange} className="form-input" placeholder="Patient's name" />
                            </div>

                            <div>
                                <label className="form-label">Treatment Provided</label>
                                <input type="text" name="treatment" required value={formData.treatment} onChange={handleChange} className="form-input" placeholder="e.g. Laser Surgery" />
                            </div>

                            <div>
                                <label className="form-label">Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="form-input">
                                    <option value="OP">OP (Outpatient)</option>
                                    <option value="IP">IP (Inpatient)</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Amount Paid</label>
                                <input type="number" step="0.01" name="amount_paid" required value={formData.amount_paid} onChange={handleChange} className="form-input" placeholder="Revenue collected" />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Remarks</label>
                            <textarea name="remarks" rows="2" value={formData.remarks} onChange={handleChange} className="form-input" placeholder="Additional notes..." />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary !py-3 text-lg mt-6">
                            {loading ? 'Submitting...' : 'Submit Conversion'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { CheckCircle2, Building2 } from 'lucide-react';

export default function CorporateTieupsForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        company_name: '',
        contact_person: '',
        phone: '',
        letter_received: false,
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
                user_id: user.id
            };

            const { error } = await supabase.from('corporate_tieups').insert([payload]);

            if (error) throw error;
            setSuccess(true);
            window.scrollTo(0, 0);

            setFormData(prev => ({
                ...prev, company_name: '', contact_person: '', phone: '', letter_received: false, remarks: ''
            }));
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-teal-900 px-8 py-6 text-white flex items-center space-x-4">
                    <div className="p-3 bg-teal-800 rounded-xl">
                        <Building2 className="w-8 h-8 text-teal-100" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Corporate Tie-ups </h1>
                        <p className="text-teal-100 text-sm mt-1">Log corporate agreements and tie-ups.</p>
                    </div>
                </div>

                <div className="p-8">
                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center space-x-3">
                            <CheckCircle2 className="w-6 h-6 shrink-0" />
                            <p className="font-medium">Success! Your corporate tie-up record has been saved.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="form-label">Date</label>
                                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="form-input" />
                            </div>

                            <div>
                                <label className="form-label">Company Name</label>
                                <input type="text" name="company_name" required value={formData.company_name} onChange={handleChange} className="form-input" placeholder="e.g. Infosys, TCS" />
                            </div>

                            <div>
                                <label className="form-label">Contact Person</label>
                                <input type="text" name="contact_person" required value={formData.contact_person} onChange={handleChange} className="form-input" placeholder="HR Manager / Decision Maker" />
                            </div>

                            <div>
                                <label className="form-label">Phone</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-input" placeholder="+91 9876543210" />
                            </div>

                            <div className="md:col-span-2 flex items-center space-x-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <input
                                    type="checkbox"
                                    name="letter_received"
                                    id="letter_received"
                                    checked={formData.letter_received}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-teal-600 rounded bg-white focus:ring-teal-500 cursor-pointer"
                                />
                                <label htmlFor="letter_received" className="font-medium text-slate-700 cursor-pointer">
                                    Consent / Agreement Letter Received?
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Remarks</label>
                            <textarea name="remarks" rows="3" value={formData.remarks} onChange={handleChange} className="form-input" placeholder="Terms of agreement, follow-ups..." />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary !py-3 text-lg mt-6">
                            {loading ? 'Saving Tie-up...' : 'Save Corporate Tie-up'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

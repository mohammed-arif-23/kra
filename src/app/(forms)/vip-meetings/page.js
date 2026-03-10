'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import ImageUpload from '@/components/ImageUpload';
import { CheckCircle2, Users } from 'lucide-react';

export default function VipMeetingsForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        vip_name: '',
        phone: '',
        pitch: '',
        follow_up_date: '',
        image_url: '',
        remarks: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const payload = { ...formData, user_id: user.id };
            if (!payload.follow_up_date) payload.follow_up_date = null;

            const { error } = await supabase
                .from('vip_meetings')
                .insert([payload]);

            if (error) throw error;
            setSuccess(true);
            window.scrollTo(0, 0);

            setFormData(prev => ({
                ...prev, vip_name: '', phone: '', pitch: '', follow_up_date: '', image_url: '', remarks: ''
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
                        <Users className="w-8 h-8 text-teal-100" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">VIP Meetings</h1>
                        <p className="text-teal-100 text-sm mt-1">Log meetings with high-value VIPs, Politicians, etc.</p>
                    </div>
                </div>

                <div className="p-8">
                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center space-x-3">
                            <CheckCircle2 className="w-6 h-6 shrink-0" />
                            <p className="font-medium">Success! Your VIP meeting record has been saved.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="form-label">Date</label>
                                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="form-input" />
                            </div>

                            <div>
                                <label className="form-label">VIP Name</label>
                                <input type="text" name="vip_name" required value={formData.vip_name} onChange={handleChange} className="form-input" placeholder="MLA / Mayor / Celeb Name" />
                            </div>

                            <div>
                                <label className="form-label">Phone</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-input" placeholder="+91 9876543210" />
                            </div>

                            <div>
                                <label className="form-label">Follow-up Date</label>
                                <input type="date" name="follow_up_date" value={formData.follow_up_date} onChange={handleChange} className="form-input" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="form-label">Discussion / Pitch</label>
                                <textarea name="pitch" rows="3" value={formData.pitch} onChange={handleChange} className="form-input" placeholder="Topics discussed..." />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <ImageUpload
                                label="Selfie / Picture Insert (Optional but recommended)"
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                            />
                        </div>

                        <div>
                            <label className="form-label">Remarks</label>
                            <textarea name="remarks" rows="2" value={formData.remarks} onChange={handleChange} className="form-input" placeholder="Any additional notes..." />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary !py-3 text-lg mt-6">
                            {loading ? 'Submitting Record...' : 'Submit VIP Meeting'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import ImageUpload from '@/components/ImageUpload';
import { CheckCircle2, ActivitySquare } from 'lucide-react';

export default function CampsForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        stage: 'First Visit',
        place: '',
        budget: '',
        walkins: '',
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

            const payload = {
                ...formData,
                budget: formData.budget || null,
                walkins: formData.walkins || null,
                user_id: user.id
            };

            const { error } = await supabase.from('camps').insert([payload]);

            if (error) throw error;
            setSuccess(true);
            window.scrollTo(0, 0);

            setFormData(prev => ({
                ...prev, place: '', budget: '', walkins: '', image_url: '', remarks: ''
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
                        <ActivitySquare className="w-8 h-8 text-teal-100" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Health Camps</h1>
                        <p className="text-teal-100 text-sm mt-1">Log camp progress (First Visit, Preparatory, Camp Day)</p>
                    </div>
                </div>

                <div className="p-8">
                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center space-x-3">
                            <CheckCircle2 className="w-6 h-6 shrink-0" />
                            <p className="font-medium">Success! Your Camp record has been saved.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="form-label">Date</label>
                                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="form-input" />
                            </div>

                            <div>
                                <label className="form-label">Stage</label>
                                <select name="stage" value={formData.stage} onChange={handleChange} className="form-input">
                                    <option value="First Visit">First Visit</option>
                                    <option value="Preparatory">Preparatory</option>
                                    <option value="Camp">Camp</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="form-label">Place / Venue</label>
                                <input type="text" name="place" required value={formData.place} onChange={handleChange} className="form-input" placeholder="Organization / Location..." />
                            </div>

                            <div>
                                <label className="form-label">Budget (if any)</label>
                                <input type="number" step="0.01" name="budget" value={formData.budget} onChange={handleChange} className="form-input" placeholder="e.g. 5000" />
                            </div>

                            {formData.stage === 'Camp' && (
                                <div>
                                    <label className="form-label">Total Walk-ins</label>
                                    <input type="number" name="walkins" required={formData.stage === 'Camp'} value={formData.walkins} onChange={handleChange} className="form-input" placeholder="Number of people attended" />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <ImageUpload
                                label="Photo Evidence"
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                            />
                        </div>

                        <div>
                            <label className="form-label">Remarks</label>
                            <textarea name="remarks" rows="2" value={formData.remarks} onChange={handleChange} className="form-input" placeholder="Observations, challenges..." />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary !py-3 text-lg mt-6">
                            {loading ? 'Submitting...' : 'Submit Camp Progress'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

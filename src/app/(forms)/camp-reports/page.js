'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import ImageUpload from '@/components/ImageUpload';
import { CheckCircle2, FileText } from 'lucide-react';

export default function CampReportsForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        program_name: '',
        place: '',
        contact_person: '',
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
                user_id: user.id
            };

            const { error } = await supabase.from('camp_reports').insert([payload]);

            if (error) throw error;
            setSuccess(true);
            window.scrollTo(0, 0);

            setFormData(prev => ({
                ...prev, program_name: '', place: '', contact_person: '', image_url: '', remarks: ''
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
                        <FileText className="w-8 h-8 text-teal-100" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Health Camp Report</h1>
                        <p className="text-teal-100 text-sm mt-1">Submit comprehensive reports after a camp is completed.</p>
                    </div>
                </div>

                <div className="p-8">
                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center space-x-3">
                            <CheckCircle2 className="w-6 h-6 shrink-0" />
                            <p className="font-medium">Success! Your Camp Report has been successfully submitted.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="form-label">Date</label>
                                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="form-input" />
                            </div>

                            <div>
                                <label className="form-label">Program Name</label>
                                <input type="text" name="program_name" required value={formData.program_name} onChange={handleChange} className="form-input" placeholder="e.g. Free Eye Checkup Camp" />
                            </div>

                            <div>
                                <label className="form-label">Place</label>
                                <input type="text" name="place" required value={formData.place} onChange={handleChange} className="form-input" placeholder="Camp Location" />
                            </div>

                            <div>
                                <label className="form-label">Contact Person</label>
                                <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className="form-input" placeholder="Name of primary contact" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <ImageUpload
                                label="Screenshot / Evidence (e.g., Signed Report, Group Photo)"
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                            />
                        </div>

                        <div>
                            <label className="form-label">Remarks</label>
                            <textarea name="remarks" rows="3" value={formData.remarks} onChange={handleChange} className="form-input" placeholder="Summary of outcomes..." />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary !py-3 text-lg mt-6">
                            {loading ? 'Submitting Report...' : 'Submit Camp Report'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

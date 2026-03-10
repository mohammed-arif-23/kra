'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import ImageUpload from '@/components/ImageUpload';
import { CheckCircle2, Stethoscope } from 'lucide-react';

export default function FieldVisitsForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        prospect_type: 'Doctor/Clinic',
        name: '',
        phone: '',
        place: '',
        pitch: '',
        status: 'W',
        follow_up_date: '',
        image_url: '',
        conversion_date: '',
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
            if (!payload.conversion_date) payload.conversion_date = null;

            const { error } = await supabase
                .from('field_visits')
                .insert([payload]);

            if (error) throw error;
            setSuccess(true);
            window.scrollTo(0, 0);

            // Reset form but keep date and type
            setFormData(prev => ({
                ...prev, name: '', phone: '', place: '', pitch: '', status: 'W',
                follow_up_date: '', image_url: '', conversion_date: '', remarks: ''
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
                        <Stethoscope className="w-8 h-8 text-teal-100" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Field Visits</h1>
                        <p className="text-teal-100 text-sm mt-1">Log visits to Doctors, Clinics, Ambulances, or Others.</p>
                    </div>
                </div>

                <div className="p-8">
                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center space-x-3">
                            <CheckCircle2 className="w-6 h-6 shrink-0" />
                            <p className="font-medium">Success! Your field visit record has been saved.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="form-label">Date</label>
                                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="form-input" />
                            </div>

                            <div>
                                <label className="form-label">Prospect Type</label>
                                <select name="prospect_type" value={formData.prospect_type} onChange={handleChange} className="form-input">
                                    <option value="Doctor/Clinic">Doctor / Clinic</option>
                                    <option value="Ambulance">Ambulance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Name</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="form-input" placeholder="Dr. John Doe / Clinic Name" />
                            </div>

                            <div>
                                <label className="form-label">Phone Number</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-input" placeholder="+91 9876543210" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="form-label">Place</label>
                                <input type="text" name="place" value={formData.place} onChange={handleChange} className="form-input" placeholder="Location or Area" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="form-label">Pitch / Discussion Details</label>
                                <textarea name="pitch" rows="3" value={formData.pitch} onChange={handleChange} className="form-input" placeholder="Key points discussed..." />
                            </div>

                            <div>
                                <label className="form-label">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                                    <option value="C">Converted (C)</option>
                                    <option value="W">Warm (W)</option>
                                    <option value="H">Hot (H)</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Follow-up Date</label>
                                <input type="date" name="follow_up_date" value={formData.follow_up_date} onChange={handleChange} className="form-input" />
                            </div>

                            {formData.status === 'C' && (
                                <div>
                                    <label className="form-label">Conversion Date</label>
                                    <input type="date" name="conversion_date" required value={formData.conversion_date} onChange={handleChange} className="form-input" />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <ImageUpload
                                label="Selfie / Picture Insert (Required if no location tracking)"
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                            />
                        </div>

                        <div>
                            <label className="form-label">Remarks</label>
                            <textarea name="remarks" rows="2" value={formData.remarks} onChange={handleChange} className="form-input" placeholder="Any additional notes..." />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary !py-3 text-lg">
                            {loading ? 'Submitting Record...' : 'Submit Field Visit'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

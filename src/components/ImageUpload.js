'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { UploadCloud, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function ImageUpload({ onUploadComplete, label = "Upload Image" }) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [error, setError] = useState('');

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            setError('');
            const url = await uploadToCloudinary(file);
            setUploadedUrl(url);
            onUploadComplete(url);
        } catch (err) {
            setError('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

            <div className="relative">
                {uploadedUrl ? (
                    <div className="flex items-center space-x-3 bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 shadow-sm transition-all hover:shadow-md cursor-pointer overflow-hidden max-h-40 group">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                <span className="font-medium text-sm truncate">Upload Complete</span>
                            </div>
                            <img src={uploadedUrl} className="mt-2 h-20 w-auto rounded border border-emerald-100 object-cover shadow-sm group-hover:scale-105 transition-transform" alt="Preview" />
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                ) : (
                    <div className={`
            border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative hover:bg-slate-50 group
            ${isUploading ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-500'}
          `}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                        />
                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center space-y-2 text-teal-600">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-medium">Uploading to Cloudinary...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                                <div className="p-3 bg-slate-100 rounded-full group-hover:bg-teal-50 transition-colors">
                                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-teal-600" />
                                </div>
                                <span className="text-sm">Click to upload or drag and drop</span>
                                <span className="text-xs text-slate-400">PNG, JPG, GIF up to 10MB</span>
                            </div>
                        )}
                    </div>
                )}

                {error && <p className="mt-2 text-sm text-rose-500 flex items-center bg-rose-50 p-2 rounded"><AlertCircle className="w-4 h-4 mr-1" />{error}</p>}
            </div>
        </div>
    );
}

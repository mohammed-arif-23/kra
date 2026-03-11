'use client';
import { useState } from 'react';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { UploadCloud, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';

export default function MultipleImageUpload({ onUploadComplete, label = "Upload Images (Max 5)", maxFiles = 5 }) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState([]);
    const [error, setError] = useState('');

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (uploadedUrls.length + files.length > maxFiles) {
            setError(`You can only upload up to ${maxFiles} images.`);
            return;
        }

        try {
            setIsUploading(true);
            setError('');

            const urls = await Promise.all(files.map(file => uploadToCloudinary(file)));

            const newUrls = [...uploadedUrls, ...urls];
            setUploadedUrls(newUrls);
            onUploadComplete(newUrls);
        } catch (err) {
            setError('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (indexToRemove) => {
        const newUrls = uploadedUrls.filter((_, index) => index !== indexToRemove);
        setUploadedUrls(newUrls);
        onUploadComplete(newUrls);
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

            <div className="relative">
                {uploadedUrls.length >= maxFiles ? (
                    <div className="flex items-center space-x-2 text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-sm">Maximum files limit reached.</span>
                    </div>
                ) : (
                    <div className={`
                        border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative hover:bg-slate-50 group mb-4
                        ${isUploading ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-500'}
                    `}>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleUpload}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                        />
                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center space-y-2 text-teal-600">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-medium">Uploading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                                <div className="p-3 bg-slate-100 rounded-full group-hover:bg-teal-50 transition-colors">
                                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-teal-600" />
                                </div>
                                <span className="text-sm underline cursor-pointer">Click to upload or drag & drop</span>
                                <span className="text-xs text-slate-400 drop-shadow-sm">Select multiple files (PNG, JPG up to 10MB)</span>
                            </div>
                        )}
                    </div>
                )}

                {uploadedUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {uploadedUrls.map((url, i) => (
                            <div key={i} className="relative group bg-slate-100 rounded border border-slate-200 overflow-hidden shadow-sm pt-[75%]">
                                <img src={url} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Preview" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 shadow z-20"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {error && <p className="mt-2 text-sm text-rose-500 flex items-center bg-rose-50 p-2 rounded"><AlertCircle className="w-4 h-4 mr-1" />{error}</p>}
            </div>
        </div>
    );
}

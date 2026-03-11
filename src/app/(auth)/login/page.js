'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { Activity, Stethoscope } from 'lucide-react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                });
                if (error) throw error;
            }
            router.push('/');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-white border-b border-slate-100 p-8 text-center rounded-t-2xl">
                    <img src="/logo.png" alt="Valli Logo" className="h-16 mx-auto mb-4 object-contain" />
                    <h2 className="text-2xl font-bold text-teal-900 tracking-tight">Valli PMS</h2>
                    <p className="text-teal-700 mt-2 text-sm leading-relaxed font-medium">
                        Performance Management System<br />Marketing Department
                    </p>
                </div>

                <div className="p-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">
                        {isLogin ? 'Sign In to Dashboard' : 'Create Staff Account'}
                    </h3>

                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-6 border border-rose-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="form-input"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}
                        <div>
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                placeholder="staff@valli.com"
                            />
                        </div>
                        <div>
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary mt-6 !py-3 shadow-md border border-teal-600"
                        >
                            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-teal-700 font-semibold hover:text-teal-900 transition-colors bg-transparent border-none p-0 inline cursor-pointer underline underline-offset-2"
                        >
                            {isLogin ? 'Register now' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

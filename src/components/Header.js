'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

export default function Header() {
    const [user, setUser] = useState(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            } else if (pathname !== '/login') {
                router.push('/login');
            }
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session) {
                    setUser(session.user);
                } else {
                    setUser(null);
                    router.push('/login');
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [router, pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (pathname === '/login') return null;

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-slate-200/50 shadow-sm transition-all">
            <div className="flex items-center justify-between px-4 lg:px-10 py-3 lg:py-4 max-w-7xl mx-auto w-full gap-2">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
                        className="md:hidden p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-teal-600 hover:bg-teal-50"
                    >
                        <User size={20} className="hidden" />
                        {/* We use a quick SVG for the menu instead of adding a new icon import to keep it clean */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <h2 className="text-lg lg:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-emerald-600 truncate">
                        Workspace
                    </h2>
                </div>

                {user && (
                    <div className="flex items-center space-x-2 lg:space-x-5 flex-shrink-0">
                        <div className="flex items-center space-x-2 lg:space-x-3 bg-white border border-slate-200/60 px-2 lg:px-4 py-1 lg:py-1.5 rounded-full shadow-sm max-w-[140px] lg:max-w-xs truncate">
                            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                                <User size={14} />
                            </div>
                            <span className="text-xs lg:text-sm font-semibold text-slate-700 truncate">
                                {user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center space-x-2 text-sm font-semibold text-rose-600 bg-rose-50/50 hover:bg-rose-100 border border-transparent hover:border-rose-200 p-2 lg:px-4 lg:py-2 rounded-xl transition-all duration-300"
                        >
                            <LogOut size={16} />
                            <span className="hidden lg:inline">Sign out</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

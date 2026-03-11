'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building2, Users, FileText, HeartHandshake,
    Stethoscope, ActivitySquare, LayoutDashboard, Receipt
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

const navItems = [
    { href: '/', label: 'My Dashboard', icon: LayoutDashboard },
    { href: '/field-visits', label: 'Field Visits', icon: Stethoscope },
    { href: '/vip-meetings', label: 'VIP Meetings', icon: Users },
    { href: '/camps', label: 'Camps', icon: ActivitySquare },
    { href: '/reviews', label: 'Google Reviews', icon: FileText },
    { href: '/camp-conversions', label: 'Camp Conversions', icon: HeartHandshake },
    { href: '/camp-reports', label: 'Camp Reports', icon: FileText },
    { href: '/corporate-tieups', label: 'Corporate Tie-ups', icon: Building2 },
    { href: '/financials', label: 'Financials', icon: Receipt },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (data?.role === 'admin') setIsAdmin(true);
            }
        };
        checkRole();
    }, [pathname]);

    useEffect(() => {
        const toggle = () => setIsOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', toggle);
        return () => window.removeEventListener('toggle-sidebar', toggle);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    if (pathname === '/login') return null;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 w-[280px] bg-[#001D22] text-white flex flex-col min-h-screen border-r border-teal-900/50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-center bg-white p-3 rounded-2xl shadow-md border border-slate-200">
                        <img src="/logo.png" alt="Valli Logo" className="h-12 object-contain" />
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-8 pt-4 custom-scrollbar">

                    {isAdmin && (
                        <div className="mb-4 pb-4 border-b border-teal-800">
                            <Link
                                href="/admin"
                                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors shadow-sm ${pathname === '/admin' ? 'bg-amber-600 text-white' : 'bg-teal-800 text-teal-50 hover:bg-amber-500 hover:text-white'}`}
                            >
                                <ActivitySquare size={20} />
                                <span className="text-sm font-bold tracking-wide">Admin Hub</span>
                            </Link>
                        </div>
                    )}

                    {!isAdmin && navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-gradient-to-r from-teal-500/20 to-transparent border-l-4 border-teal-400 text-teal-100 shadow-[inset_0px_1px_0px_rgba(255,255,255,0.05)]'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-teal-400 drop-shadow-md pb-0.5' : 'text-slate-500 group-hover:text-teal-400 transition-colors'} />
                                <span className="text-[13px] font-semibold tracking-wide drop-shadow-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}

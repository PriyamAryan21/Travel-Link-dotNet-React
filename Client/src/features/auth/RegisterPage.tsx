import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Loader2, Plane } from 'lucide-react';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register({ name, email, password });
            navigate('/dashboard', { replace: true });
        } catch {
            // toast handled by unwrap()
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: "url('/bg-travel.png')" }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-900/30"></div>

            {/* Left Side: Form (on desktop) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">

                <div className="glass-card w-full max-w-sm p-8 sm:p-12 animate-fade-in-up shadow-2xl" style={{ animationDelay: '0.1s' }}>

                    {/* Mobile Only Header */}
                    <div className="lg:hidden text-center mb-8 flex flex-col items-center">
                        <h1 className="flex select-none items-baseline justify-center drop-shadow-md">
                            <span className='font-cardo font-bold text-6xl text-white'>Travel</span>
                            <span className="font-vibes font-bold text-nature-gradient text-6xl">Link</span>
                        </h1>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-2xl font-semibold mb-2 text-white">Create your account</h2>
                        <p className="text-slate-300 text-sm">Start your journey with us</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div style={{ marginTop: '1rem' }}>
                            <label htmlFor="reg-name" className="block text-sm font-medium text-slate-200 mb-1.5">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="reg-name"
                                    type="text"
                                    className="input-field bg-slate-900/40 border-white/10 focus:border-sky-500/50"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-200 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="reg-email"
                                    type="email"
                                    className="input-field bg-slate-900/40 border-white/10 focus:border-sky-500/50"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-200 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="reg-password"
                                    type="password"
                                    className="input-field bg-slate-900/40 border-white/10 focus:border-sky-500/50"
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>

                            <button
                                type="submit"
                                className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Plane className="w-5 h-5" />
                                        Create Account
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-slate-300 mt-20 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors drop-shadow">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side: Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-16 relative z-10 text-white">

                <div className="animate-fade-in-up flex flex-col items-center text-center max-w-md">
                    <h1 className="select-none drop-shadow-lg flex items-baseline justify-center">
                        <span className='font-cardo font-bold text-9xl text-white'>Travel</span>
                        <span className="font-vibes font-bold text-nature-gradient text-9xl">Link</span>
                    </h1>
                    <p className="text-xl text-slate-100 leading-relaxed drop-shadow">
                        Plan your perfect getaway, split expenses, and create unforgettable memories with your favorite people.
                    </p>
                </div>
            </div>
        </div>
    );
}

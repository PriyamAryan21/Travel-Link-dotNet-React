import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Mail, Lock, User, Loader2, Plane } from 'lucide-react';

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
        <div className="auth-gradient relative overflow-hidden flex items-center justify-center p-4">
            <div className="auth-glow bg-purple-500 top-[-100px] right-[-50px] absolute" />
            <div className="auth-glow bg-indigo-500 bottom-[-100px] left-[-50px] absolute" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 mb-4">
                        <MapPin className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Travel<span className="text-indigo-400">Link</span>
                    </h1>
                    <p className="text-slate-400 mt-2">Start your journey</p>
                </div>

                {/* Register Card */}
                <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <h2 className="text-xl font-semibold mb-6">Create your account</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="reg-name" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="reg-name"
                                    type="text"
                                    className="input-field pl-10"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="reg-email"
                                    type="email"
                                    className="input-field pl-10"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="reg-password"
                                    type="password"
                                    className="input-field pl-10"
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Plane className="w-4 h-4" />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p
                    className="text-center text-slate-400 mt-6 text-sm animate-fade-in-up"
                    style={{ animationDelay: '0.2s' }}
                >
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

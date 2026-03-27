import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { login, signup } from '../services/api';

const AuthPage = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const payload = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            if (isLogin) {
                await login({ email: payload.email, password: payload.password });
            } else {
                await signup(payload);
            }
            navigate('/dashboard');
        } catch (submitError) {
            console.error(submitError);
            setError(submitError.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl ring-1 ring-slate-900/5">
                <div>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                        <BrainCircuit className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
                        {isLogin ? 'Sign in to your account' : 'Create new account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        Or{' '}
                        <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors focus:outline-none focus:underline">
                            {isLogin ? 'start your 14-day free trial' : 'sign in to your existing account'}
                        </button>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="sr-only">Full Name</label>
                                <input id="name" name="name" type="text" required
                                    className="relative block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow"
                                    placeholder="Full Name" />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input id="email-address" name="email" type="email" autoComplete="email" required
                                className="relative block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow"
                                placeholder="Email address" />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input id="password" name="password" type="password" autoComplete="current-password" required
                                className="relative block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow"
                                placeholder="Password" />
                        </div>
                    </div>

                    {isLogin && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-colors" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">Remember me</label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">Forgot your password?</a>
                            </div>
                        </div>
                    )}

                        <div>
                            <button type="submit" className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors shadow-md hover:shadow-lg">
                            {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
                        </button>
                    </div>
                </form>
                {error && (
                    <p className="text-sm text-red-600 text-center">{error}</p>
                )}
                
                <div className="mt-6 text-center">
                    <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 font-medium">
                        &larr; Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;

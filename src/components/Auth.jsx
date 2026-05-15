import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Globe, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const payload = isLogin 
            ? { email: formData.email, password: formData.password }
            : { username: formData.username, email: formData.email, password: formData.password };

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        try {
            // Note: Replace with actual fetch once backend is confirmed running
            const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, "");
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                setError(data.msg || 'Authentication failed');
            }
        } catch (err) {
            setError('Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'radial-gradient(circle at center, #1a1a1f 0%, #050505 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background Elements */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '40vw',
                height: '40vw',
                background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)',
                filter: 'blur(80px)',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-10%',
                width: '40vw',
                height: '40vw',
                background: 'radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 70%)',
                filter: 'blur(80px)',
                zIndex: 0
            }} />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="glass"
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    padding: '3rem',
                    borderRadius: '24px',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto 1.5rem auto' }}
                    >
                        ← BACK TO DASHBOARD
                    </button>
                    <h2 style={{ 
                        fontSize: '2rem', 
                        letterSpacing: '0.2em', 
                        textTransform: 'uppercase',
                        marginBottom: '0.5rem',
                        color: 'white'
                    }}>
                        {isLogin ? 'Welcome' : 'Create'} <span className="cinematic-text" style={{ color: 'var(--accent-gold)' }}>Back</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                        {isLogin ? 'Enter your credentials to access the studio' : 'Join the elite cinematic production community'}
                    </p>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5',
                            padding: '0.8rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                    <input 
                                        type="text" 
                                        name="username"
                                        placeholder="Username"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%',
                                            padding: '1rem 1rem 1rem 3rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            outline: 'none',
                                            transition: 'border-color 0.3s'
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        <input 
                            type="email" 
                            name="email"
                            placeholder="Email Address"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        <input 
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '1rem 3rem 1rem 3rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                    <input 
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        placeholder="Confirm Password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%',
                                            padding: '1rem 3rem 1rem 3rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(v => !v)}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: 'var(--accent-gold)',
                            color: 'black',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'transform 0.3s, background 0.3s',
                            opacity: loading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {loading ? 'Authenticating...' : (isLogin ? 'Access Studio' : 'Create Account')}
                        <ArrowRight size={18} />
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--accent-gold)', 
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                textDecoration: 'underline'
                            }}
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>

                <div style={{ 
                    marginTop: '2.5rem', 
                    paddingTop: '2rem', 
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>Or continue with</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'white' }} onClick={() => {
                            window.location.href = 'http://localhost:5000/auth/microsoft';
                        }}>
                            <Mail size={18} /> Hotmail
                        </button>
                        <button style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'white' }} onClick={() => {
                            // Placeholder for Google OAuth flow – replace with real endpoint
                            window.location.href = 'http://localhost:5000/auth/google';
                        }}>
                            <Globe size={18} /> Google
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;

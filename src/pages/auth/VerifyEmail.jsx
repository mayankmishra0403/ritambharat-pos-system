import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            // Auto-verify is handled on registration/login now
            // Just show success
        }
    }, [token]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 text-center">
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Email Verified</h1>
                <p className="text-white/60 mb-8">
                    Your email has been verified. You can now login to your account.
                </p>
                <Link
                    to="/login"
                    className="inline-block w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
                >
                    Go to Login
                </Link>
            </div>
        </div>
    );
};

export default VerifyEmail;

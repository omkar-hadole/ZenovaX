import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { getOptimizedImageUrl } from '../utils/cloudinary';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [toast, setToast] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const { user } = useAuth();

  const images = [
    'https://images.pexels.com/photos/10643964/pexels-photo-10643964.jpeg',
    'https://images.pexels.com/photos/5011647/pexels-photo-5011647.jpeg',
    'https://images.pexels.com/photos/8347499/pexels-photo-8347499.jpeg',
  ];

  useEffect(() => {
    if (user && user.id) {
      if (!user.isProfileComplete) {
        navigate('/complete-profile');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'MENTOR' || user.role === 'BOTH') {
        navigate('/mentor/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    // image 
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl glass rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          {/* ok  */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 relative overflow-hidden flex-col min-h-[700px]">
            <div className="absolute top-8 left-8 z-10">
              <h1 className="text-3xl md:text-4xl font-light text-white tracking-tight">
                ZenovaX
              </h1>
            </div>

            <div className="absolute top-8 right-8 z-10">
              <button onClick={() => navigate('/')} className="rounded-full text-white text-sm font-light hover:bg-white/10 transition-all duration-300 flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/20 px-4 py-2">
                Back to website
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center text-white relative">
              <img
                src={getOptimizedImageUrl(images[currentImage], { width: 1152, height: 1400 })}
                width={576}
                height={700}
                fetchPriority="high"
                alt="ZenovaX platform feature showcase"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`block h-1 rounded-full cursor-pointer transition-all duration-300 ${idx === currentImage ? 'bg-white w-12' : 'bg-white/40 w-8'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ok - r  */}
          <div className="w-full md:w-1/2 bg-white/50 dark:bg-gray-900/60 backdrop-blur-xl p-6 md:p-12 flex items-center justify-center">
            <div className="w-full max-w-md">
              {isLogin ? (
                <LoginForm
                  onToggle={() => setIsLogin(false)}
                  showToast={setToast}
                />
              ) : (
                <SignupForm
                  onToggle={() => setIsLogin(true)}
                  showToast={setToast}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
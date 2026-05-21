import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../core/store/useAuthStore';
import { authService } from '../api/auth.service';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      // El backend devuelve: { message, data: { user, token } }
      const { user, token } = response.data.data;
      if (!token) throw new Error('No se recibió token del servidor');
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/20 blur-[100px] animate-pulse"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2 mb-6 opacity-80 hover:opacity-100 transition-opacity">
            <Icon icon="mdi:rocket-launch" className="text-3xl text-blue-500" />
            <span className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-white">PresuSoft</span>
          </Link>
          <h2 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight">Bienvenido de vuelta</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2 font-medium">Ingresa tus credenciales para continuar</p>
        </div>

        <div className="card">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-sm text-center font-medium">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-2 pl-1">Correo Electrónico</label>
              <div className="relative">
                <Icon icon="mdi:email-outline" className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 text-lg" />
                <input 
                  type="email" 
                  required
                  className="input-base pl-11 bg-white/50 dark:bg-secondary-950/50 " 
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 pl-1">
                <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300">Contraseña</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="relative">
                <Icon icon="mdi:lock-outline" className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 text-lg" />
                <input 
                  type="password" 
                  required
                  className="input-base pl-11 bg-white/50 dark:bg-secondary-950/50 " 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="btn-primary w-full shadow-blue-500/25 py-3.5 text-base" disabled={isLoading}>
                {isLoading ? (
                  <Icon icon="mdi:loading" className="animate-spin text-2xl" />
                ) : (
                  'Ingresar al Dashboard'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
            <p className="text-secondary-500 dark:text-secondary-400">
              ¿No tienes una cuenta? <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Crea una gratis</Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs font-semibold text-secondary-400 dark:text-secondary-600">
            Hecho por <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Biznovatech</span>
        </div>
      </motion.div>
    </div>
  );
}


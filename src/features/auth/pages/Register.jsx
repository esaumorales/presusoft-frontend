import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../core/store/useAuthStore';
import { authService } from '../api/auth.service';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.register(formData);
      // El backend devuelve: { message, data: { user, token } }
      const { user, token } = response.data.data;
      if (token && user) {
        login(user, token);
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Error en registro:', err);
      setError(err.response?.data?.message || 'Hubo un error al crear tu cuenta. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/20 blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2 mb-6 opacity-80 hover:opacity-100 transition-opacity">
            <Icon icon="mdi:rocket-launch" className="text-3xl text-purple-500" />
            <span className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-white">PresuSoft</span>
          </Link>
          <h2 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight">Crea tu cuenta</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2 font-medium">Empieza a presupuestar gratis en segundos</p>
        </div>

        <div className="card">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-sm text-center font-medium">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-1.5 pl-1">Nombre Completo</label>
              <div className="relative">
                <Icon icon="mdi:account-outline" className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 text-lg" />
                <input 
                  name="name"
                  type="text" 
                  required
                  className="input-base pl-11 bg-white/50 dark:bg-secondary-950/50 " 
                  placeholder="Ej. Juan Pérez"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-1.5 pl-1">Correo Electrónico</label>
              <div className="relative">
                <Icon icon="mdi:email-outline" className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 text-lg" />
                <input 
                  name="email"
                  type="email" 
                  required
                  className="input-base pl-11 bg-white/50 dark:bg-secondary-950/50 " 
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-1.5 pl-1">Teléfono (Opcional)</label>
              <div className="relative">
                <Icon icon="mdi:phone-outline" className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 text-lg" />
                <input 
                  name="phone"
                  type="tel" 
                  className="input-base pl-11 bg-white/50 dark:bg-secondary-950/50 " 
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-1.5 pl-1">Contraseña</label>
              <div className="relative">
                <Icon icon="mdi:lock-outline" className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 text-lg" />
                <input 
                  name="password"
                  type="password" 
                  required
                  className="input-base pl-11 bg-white/50 dark:bg-secondary-950/50 " 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="btn-primary w-full py-3.5 text-base border-0" disabled={isLoading}>
                {isLoading ? (
                  <Icon icon="mdi:loading" className="animate-spin text-2xl" />
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
            <p className="text-secondary-500 dark:text-secondary-400">
              ¿Ya tienes una cuenta? <Link to="/login" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">Inicia Sesión</Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs font-semibold text-secondary-400 dark:text-secondary-600">
            Hecho por <span className="text-blue-500">Biznovatech</span>
        </div>
      </motion.div>
    </div>
  );
}


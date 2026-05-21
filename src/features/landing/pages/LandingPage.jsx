import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

// Dashboard Mockup 3D Realista
const DashboardMockup = () => (
  <div className="w-full bg-white dark:bg-secondary-900 rounded-2xl shadow-[0_30px_60px_rgba(16,42,67,0.4)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-secondary-200 dark:border-secondary-700 overflow-hidden flex flex-col h-[600px] relative">
    
    {/* Floating elements inside mockup for 3D effect */}
    <div className="absolute top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
    <div className="absolute top-40 -left-10 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

    {/* Mac OS Style Header */}
    <div className="bg-secondary-50/80 dark:bg-secondary-950/80 backdrop-blur-md h-12 border-b border-secondary-200 dark:border-secondary-800 flex items-center px-4 gap-2 z-10">
      <div className="w-3 h-3 rounded-full bg-red-400 shadow-inner"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-inner"></div>
      <div className="w-3 h-3 rounded-full bg-green-400 shadow-inner"></div>
      <div className="ml-4 h-5 w-48 bg-white/50 dark:bg-secondary-800/50 rounded-md"></div>
    </div>
    <div className="flex flex-1 overflow-hidden z-10">
      {/* Sidebar Mock */}
      <div className="w-56 bg-secondary-900 dark:bg-secondary-950 border-r border-secondary-800 p-6 flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute -left-10 top-20 w-32 h-32 bg-secondary-700 rounded-full blur-3xl opacity-50"></div>
        <div className="h-8 w-32 bg-secondary-700 rounded-lg mb-6 flex items-center px-2 gap-2">
          <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
          <div className="h-2 w-16 bg-secondary-600 rounded"></div>
        </div>
        <div className="h-10 w-full bg-secondary-800 rounded-xl flex items-center px-3 gap-3">
          <div className="w-5 h-5 bg-secondary-600 rounded-md"></div>
          <div className="h-2 w-20 bg-secondary-600 rounded"></div>
        </div>
        <div className="h-5 w-5/6 bg-secondary-800 rounded-md"></div>
        <div className="h-5 w-full bg-secondary-800 rounded-md"></div>
        <div className="h-5 w-4/6 bg-secondary-800 rounded-md"></div>
      </div>
      {/* Main Content Mock */}
      <div className="flex-1 bg-secondary-50/50 dark:bg-secondary-900/50 p-8 flex flex-col gap-8 relative overflow-hidden">
        
        {/* Topbar inside */}
        <div className="flex justify-between items-center transform translate-z-20">
          <div>
            <div className="h-8 w-64 bg-secondary-200 dark:bg-secondary-700 rounded-lg mb-2"></div>
            <div className="h-4 w-32 bg-secondary-100 dark:bg-secondary-800 rounded-md"></div>
          </div>
          <div className="h-12 w-32 bg-blue-600 rounded-full shadow-lg shadow-blue-500/30"></div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 transform translate-z-40">
          {[1,2,3].map(i => (
             <div key={i} className="h-32 bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-100 dark:border-secondary-700 shadow-md p-5 flex flex-col justify-between">
                <div className="w-10 h-10 bg-secondary-50 dark:bg-secondary-900 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 bg-secondary-200 dark:bg-secondary-600 rounded-full"></div>
                </div>
                <div>
                  <div className="h-6 w-24 bg-secondary-800 dark:bg-white rounded-md mb-2"></div>
                  <div className="h-3 w-16 bg-secondary-200 dark:bg-secondary-600 rounded"></div>
                </div>
             </div>
          ))}
        </div>

        {/* Big Chart Area */}
        <div className="flex-1 bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-100 dark:border-secondary-700 shadow-md p-6 flex flex-col gap-4 transform translate-z-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 dark:from-secondary-900/50 to-transparent"></div>
          <div className="flex justify-between items-center relative z-10">
            <div className="h-6 w-48 bg-secondary-100 dark:bg-secondary-700 rounded-md"></div>
            <div className="h-8 w-24 bg-secondary-50 dark:bg-secondary-900 rounded-full border border-secondary-200 dark:border-secondary-600"></div>
          </div>
          
          {/* Simulated Chart Bars */}
          <div className="flex-1 flex items-end gap-3 pt-6 relative z-10">
            {[40, 70, 45, 90, 65, 80, 55, 100, 75, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-100 dark:bg-secondary-700 rounded-t-md relative group">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-md transition-all duration-500" 
                  style={{ height: `${h}%` }}
                ></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  </div>
);

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax effects based on scroll
  const yHero = useTransform(scrollYProgress, [0, 0.2], [0, -150]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  
  const scaleMockup = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
  const rotateXMockup = useTransform(scrollYProgress, [0, 0.2], [10, 0]);
  const yMockup = useTransform(scrollYProgress, [0, 0.2], [0, -100]);

  useEffect(() => {
    // Check system preference on load
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(!isDark);

  return (
    <div ref={containerRef} className="min-h-[200vh] bg-secondary-50 dark:bg-secondary-900 font-sans overflow-x-hidden transition-colors duration-500">
      
      {/* Dynamic Glowing Orbs Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px]"
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-400/20 dark:bg-purple-900/20 blur-[120px]"
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#829ab1_1px,transparent_1px),linear-gradient(to_bottom,#829ab1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#334e68_1px,transparent_1px),linear-gradient(to_bottom,#334e68_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)] opacity-20"></div>
      </div>

      {/* Glassmorphism Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between p-4 px-6 bg-white/70 dark:bg-secondary-900/70 glass-effect rounded-2xl border border-secondary-200/50 dark:border-secondary-700/50 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-900 dark:bg-white rounded-xl flex items-center justify-center transform rotate-3 shadow-md">
            <Icon icon="mdi:rocket-launch" className="text-2xl text-white dark:text-secondary-900" />
          </div>
          <span className="text-2xl font-bold text-secondary-900 dark:text-white tracking-tight">PresuSoft</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleDark}
            className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-300 transition-colors"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <Icon icon="mdi:white-balance-sun" className="text-2xl" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <Icon icon="mdi:moon-and-stars" className="text-2xl" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <Link to="/login" className="hidden md:inline-flex font-semibold text-secondary-700 dark:text-secondary-200 hover:text-secondary-900 dark:hover:white px-4">
            Ingresar
          </Link>
          <Link to="/register" className="btn-primary shadow-blue-500/25 dark:shadow-none">
            Empezar Gratis
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.main 
        style={{ y: yHero, opacity: opacityHero }}
        className="relative z-10 flex flex-col items-center pt-48 pb-16 px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-secondary-800/50 glass-effect text-secondary-800 dark:text-secondary-200 text-sm font-semibold mb-8 border border-secondary-200/50 dark:border-secondary-700/50 shadow-xl"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Sistema Presupuestario Inteligente v2.0
        </motion.div>

        <motion.h1 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1, type: "spring" }}
          className="text-6xl md:text-8xl font-black text-secondary-900 dark:text-white mb-8 max-w-5xl tracking-tighter leading-[1.1]"
        >
          Cotiza con precisión <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 filter drop-shadow-sm">
            absoluta.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-secondary-600 dark:text-secondary-300 mb-12 max-w-3xl font-medium leading-relaxed"
        >
          La plataforma definitiva para agencias y freelancers. Arrastra, suelta y el motor matemático hará el resto. Genera PDFs corporativos en segundos.
        </motion.p>
      </motion.main>

      {/* 3D Dashboard Mockup connected to scroll */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 pb-32 perspective-1000">
        <motion.div
          style={{ scale: scaleMockup, rotateX: rotateXMockup, y: yMockup }}
          className="w-full transform-style-3d"
        >
          <Tilt 
            tiltMaxAngleX={4} 
            tiltMaxAngleY={4} 
            perspective={1200} 
            transitionSpeed={2000} 
            scale={1}
            gyroscope={true}
            glareEnable={true}
            glareMaxOpacity={0.15}
            glarePosition="all"
            className="transform-style-3d rounded-2xl"
          >
            {/* Elementos 3D flotantes alrededor del mockup */}
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-12 -right-12 w-24 h-24 bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl flex items-center justify-center transform translate-z-50 border border-secondary-100 dark:border-secondary-700"
            >
              <Icon icon="mdi:file-pdf-box" className="text-5xl text-red-500" />
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -left-10 w-28 h-28 bg-white dark:bg-secondary-800 rounded-full shadow-2xl flex items-center justify-center transform translate-z-50 border border-secondary-100 dark:border-secondary-700"
            >
              <Icon icon="mdi:chart-pie" className="text-6xl text-blue-500" />
            </motion.div>

            <DashboardMockup />
          </Tilt>
        </motion.div>
      </div>

      {/* Immersive Scroll Features Section */}
      <section id="features" className="relative z-20 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-32"
          >
            <h2 className="text-5xl md:text-7xl font-black text-secondary-900 dark:text-white mb-6 tracking-tighter">
              El fin del <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Excel</span> tradicional.
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto font-medium">Una experiencia visual inmersiva que oculta un motor matemático capaz de calcular cientos de variables en milisegundos.</p>
          </motion.div>

          <div className="space-y-32">
            {/* Feature 1: Módulos (Left Aligned) */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col md:flex-row items-center gap-16 perspective-1000"
            >
              <div className="flex-1">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
                  <Icon icon="mdi:view-grid-plus" className="text-3xl text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-4xl font-black text-secondary-900 dark:text-white mb-6">Construcción Modular</h3>
                <p className="text-xl text-secondary-600 dark:text-secondary-300 leading-relaxed">
                  Rompe tus proyectos en fases. Arrastra tareas y costos extra como si jugaras con bloques. El lienzo de PresuSoft se adapta a la complejidad de tu proyecto sin abrumarte.
                </p>
              </div>
              <Tilt className="flex-1 w-full" tiltMaxAngleX={10} tiltMaxAngleY={10} glareEnable glareMaxOpacity={0.1}>
                <div className="relative rounded-3xl overflow-hidden glass-effect bg-white/40 dark:bg-secondary-800/40 border border-secondary-200 dark:border-secondary-700 p-8 shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full"></div>
                  <div className="space-y-4 relative z-10">
                    <div className="h-16 bg-white dark:bg-secondary-900 rounded-2xl shadow-sm border border-secondary-100 dark:border-secondary-700 flex items-center px-6 transform translate-x-4">
                      <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/50"></div>
                      <div className="ml-4 h-4 w-32 bg-secondary-200 dark:bg-secondary-700 rounded-full"></div>
                    </div>
                    <div className="h-16 bg-white dark:bg-secondary-900 rounded-2xl shadow-sm border border-secondary-100 dark:border-secondary-700 flex items-center px-6 transform -translate-x-2">
                      <div className="w-8 h-8 rounded-md bg-purple-100 dark:bg-purple-900/50"></div>
                      <div className="ml-4 h-4 w-48 bg-secondary-200 dark:bg-secondary-700 rounded-full"></div>
                    </div>
                    <div className="h-16 bg-white dark:bg-secondary-900 rounded-2xl shadow-sm border border-secondary-100 dark:border-secondary-700 flex items-center px-6 transform translate-x-8">
                      <div className="w-8 h-8 rounded-md bg-green-100 dark:bg-green-900/50"></div>
                      <div className="ml-4 h-4 w-24 bg-secondary-200 dark:bg-secondary-700 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </Tilt>
            </motion.div>

            {/* Feature 2: Matemáticas (Right Aligned) */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col md:flex-row-reverse items-center gap-16 perspective-1000"
            >
              <div className="flex-1">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30">
                  <Icon icon="mdi:calculator-variant" className="text-3xl text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-4xl font-black text-secondary-900 dark:text-white mb-6">Precisión Milimétrica</h3>
                <p className="text-xl text-secondary-600 dark:text-secondary-300 leading-relaxed">
                  Deja de preocuparte por fórmulas rotas. El motor interno de PresuSoft suma horas, multiplica tarifas, calcula márgenes de beneficio e inyecta los impuestos correspondientes en tiempo real.
                </p>
              </div>
              <Tilt className="flex-1 w-full" tiltMaxAngleX={10} tiltMaxAngleY={10} glareEnable glareMaxOpacity={0.1}>
                <div className="relative rounded-3xl overflow-hidden glass-effect bg-white/40 dark:bg-secondary-800/40 border border-secondary-200 dark:border-secondary-700 p-10 shadow-2xl flex flex-col items-center justify-center">
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 blur-3xl rounded-full"></div>
                  <div className="text-center relative z-10">
                    <p className="text-secondary-500 dark:text-secondary-400 text-lg mb-2 font-medium">Subtotal Dinámico</p>
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary-900 to-secondary-600 dark:from-white dark:to-secondary-300 tracking-tighter">
                      $24,500<span className="text-4xl">.00</span>
                    </div>
                    <div className="mt-6 flex justify-center gap-2">
                      <span className="px-3 py-1 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-sm font-bold border border-green-500/30">+ IVA (16%)</span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full text-sm font-bold border border-blue-500/30">Margen 20%</span>
                    </div>
                  </div>
                </div>
              </Tilt>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Massive CTA Section */}
      <section className="relative z-20 py-32 overflow-hidden border-t border-secondary-200 dark:border-secondary-800">
        <div className="absolute inset-0 bg-secondary-900 dark:bg-black"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-[150px] opacity-40 animate-pulse pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.h2 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter"
          >
            Sube el nivel de tus <br /> propuestas comerciales.
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-secondary-300 mb-12"
          >
            Únete a los profesionales que cotizan rápido y cierran más proyectos.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/register" className="inline-flex items-center justify-center bg-white text-secondary-900 hover:bg-secondary-50 px-10 py-5 rounded-full text-lg font-bold shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all duration-300 transform hover:-translate-y-1">
              Comenzar Ahora Gratis
              <Icon icon="mdi:arrow-right" className="ml-2 text-2xl" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="relative z-20 bg-secondary-950 dark:bg-black text-secondary-400 py-8 border-t border-secondary-800/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <Icon icon="mdi:rocket-launch" className="text-xl" />
            <span className="font-bold tracking-tight text-white">PresuSoft</span>
          </div>
          <div className="text-sm font-medium">
            Hecho con <Icon icon="mdi:heart" className="inline text-red-500 mx-1" /> por <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Biznovatech</span>.
          </div>
        </div>
      </footer>
    </div>
  );
}

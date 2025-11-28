import React, { useState, useEffect, useRef } from 'react';
import { Zap, Anchor, Heart, Shield, Play, Pause, ArrowRight, Check, RefreshCw } from 'lucide-react';

const StructureSimulator = () => {
  // --- GAME STATE ---
  const [level, setLevel] = useState(1); // 1: Void, 2: Container, 3: Organism, 4: Architect
  const [showTutorial, setShowTutorial] = useState(true);
  
  // --- SIMULATION STATE ---
  const [innovation, setInnovation] = useState(50);
  const [discipline, setDiscipline] = useState(0); // Starts locked at 0
  const [stress, setStress] = useState(0);
  const [stagnation, setStagnation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // --- REFS ---
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const particles = useRef([]);
  const stressRef = useRef(0);
  const stagnationRef = useRef(0);

  // --- CONFIG ---
  const numParticles = 60;
  
  // --- COLOR PALETTE (Duo Style) ---
  const colors = {
    bg: '#ffffff',
    primary: '#58CC02', // Green
    secondary: '#1CB0F6', // Blue
    accent: '#FFC800', // Yellow
    danger: '#FF4B4B', // Red
    dark: '#2B2B2B',
    grey: '#E5E5E5',
    particles: ['#58CC02', '#1CB0F6', '#FFC800', '#FF9600', '#CE82FF']
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const initParticles = () => {
      particles.current = [];
      for (let i = 0; i < numParticles; i++) {
        particles.current.push({
          x: Math.random() * 400,
          y: Math.random() * 400,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          size: Math.random() * 6 + 4,
          color: colors.particles[Math.floor(Math.random() * colors.particles.length)],
        });
      }
    };
    initParticles();
  }, []);

  // --- LEVEL MANAGEMENT ---
  const nextLevel = () => {
    setLevel(prev => Math.min(4, prev + 1));
    setShowTutorial(true);
    // Reset specific states for levels
    if (level === 1) setDiscipline(50); // Auto-set discipline when unlocking level 2
  };

  const ScenarioButton = ({ title, action, color }) => (
    <button 
      onClick={action}
      className={`w-full py-3 px-4 rounded-2xl font-bold text-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-between group`}
      style={{ backgroundColor: color }}
    >
      <span>{title}</span>
      <ArrowRight size={20} className="opacity-50 group-hover:opacity-100 transition-opacity" />
    </button>
  );

  // --- PHYSICS ENGINE ---
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear Canvas
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    
    // Environment Feedback (Background Tint)
    if (level >= 3) {
        if (stressRef.current > 50) {
            ctx.fillStyle = `rgba(255, 75, 75, ${stressRef.current / 500})`;
            ctx.fillRect(0, 0, width, height);
        }
        if (stagnationRef.current > 50) {
            ctx.fillStyle = `rgba(100, 100, 100, ${stagnationRef.current / 400})`;
            ctx.fillRect(0, 0, width, height);
        }
    }

    // Draw Container (Only Level 2+)
    const baseRadius = 120;
    // Radius shrinks slightly with discipline, but line gets thicker
    const boundaryRadius = baseRadius + (100 - discipline) * 0.5;
    
    if (level >= 2) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, boundaryRadius, 0, Math.PI * 2);
        
        // Container Style
        ctx.strokeStyle = colors.grey;
        ctx.lineWidth = 8;
        ctx.stroke(); // Background ring
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, boundaryRadius, 0, Math.PI * 2);
        
        // Active ring
        if (stressRef.current > 80 && level >= 3) {
             ctx.strokeStyle = colors.danger;
             ctx.setLineDash([15, 10]);
        } else {
             ctx.strokeStyle = colors.secondary;
             ctx.setLineDash([]);
        }
        
        // Opacity based on discipline (if level 2, always visible but maybe thin if low discipline)
        // If discipline is 0, the container is effectively "open" (invisible active ring)
        ctx.lineWidth = 8;
        if (discipline < 10) ctx.strokeStyle = 'rgba(0,0,0,0)';
        
        ctx.stroke();
    }

    // Particle Logic
    let collisions = 0;
    let totalSpeed = 0;

    particles.current.forEach(p => {
      // 1. MOVEMENT (Innovation)
      // Base speed + Innovation multiplier
      const speedMult = 0.5 + (innovation / 20);
      const jitter = innovation / 100;

      // Random jitter only adds if innovation is high
      p.vx += (Math.random() - 0.5) * jitter * 0.5;
      p.vy += (Math.random() - 0.5) * jitter * 0.5;

      // 2. GRAVITY (Discipline) - Only Level 2+
      if (level >= 2 && discipline > 10) {
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          const gravity = discipline * 0.0005;
          p.vx += dx * gravity;
          p.vy += dy * gravity;
      }

      // 3. FRICTION
      // Friction prevents infinite acceleration
      const friction = 0.96; 
      p.vx *= friction;
      p.vy *= friction;

      // Update Position
      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;
      
      totalSpeed += Math.abs(p.vx) + Math.abs(p.vy);

      // 4. BOUNDARY PHYSICS
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (level >= 2 && discipline > 20) {
          // Hard Containment
          if (dist + p.size > boundaryRadius) {
              // Collision Vector
              const angle = Math.atan2(dy, dx);
              
              // Push back inside
              p.x = centerX + Math.cos(angle) * (boundaryRadius - p.size);
              p.y = centerY + Math.sin(angle) * (boundaryRadius - p.size);

              // Bounce
              p.vx *= -0.8;
              p.vy *= -0.8;
              
              // Calculate collision force for stress
              const impact = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
              if (impact > 2) collisions++;
          }
      } else {
          // Wrap Around (The Void)
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;
      }

      // Draw Particle (Juicy)
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      
      // Color Logic (Grey if stagnated)
      if (level >= 3 && stagnationRef.current > 70) {
          ctx.fillStyle = '#9CA3AF';
      } else {
          ctx.fillStyle = p.color;
      }
      ctx.fill();
      
      // Specular highlight for 3D feel
      ctx.beginPath();
      ctx.arc(p.x - p.size*0.3, p.y - p.size*0.3, p.size/3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();
    });

    // --- GAME LOGIC (Level 3+) ---
    if (level >= 3) {
        // Stress Logic (Collisions)
        if (collisions > 5) {
            stressRef.current = Math.min(100, stressRef.current + 0.5);
        } else {
            stressRef.current = Math.max(0, stressRef.current - 0.3);
        }

        // Stagnation Logic (Low Speed)
        const avgSpeed = totalSpeed / numParticles;
        if (avgSpeed < 1.0) {
            stagnationRef.current = Math.min(100, stagnationRef.current + 0.3);
        } else {
            stagnationRef.current = Math.max(0, stagnationRef.current - 0.5);
        }

        // Sync to React State (Throttled)
        if (Math.random() > 0.9) {
            setStress(Math.round(stressRef.current));
            setStagnation(Math.round(stagnationRef.current));
        }
    }

    if (isPlaying) requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, innovation, discipline, level]);


  // --- UI COMPONENTS ---

  const ProgressBar = () => (
    <div className="w-full h-4 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div 
            className="h-full transition-all duration-500 ease-out"
            style={{ 
                width: `${(level / 4) * 100}%`,
                backgroundColor: colors.primary 
            }}
        />
    </div>
  );

  const HealthMeter = ({ label, value, color, icon: Icon }) => (
    <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wide">
            <span className="flex items-center gap-1"><Icon size={12}/> {label}</span>
            <span>{value}%</span>
        </div>
        <div className="h-6 w-full bg-gray-200 rounded-xl overflow-hidden border-2 border-gray-200 relative">
            <div 
                className="h-full transition-all duration-300 rounded-lg"
                style={{ 
                    width: `${value}%`, 
                    backgroundColor: color 
                }}
            />
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col items-center p-4 md:p-8">
      
      {/* HEADER AREA */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-black text-slate-700 tracking-tight">
                Structure<span style={{color: colors.primary}}>Sim</span>
            </h1>
            <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-xl font-bold text-sm border-2 border-yellow-200">
                Lvl {level}: {
                    level === 1 ? "The Void" : 
                    level === 2 ? "The Container" : 
                    level === 3 ? "The Biology" : "The Architect"
                }
            </div>
        </div>
        <ProgressBar />
      </div>

      {/* MAIN CARD */}
      <div className="bg-white p-2 rounded-3xl shadow-[0_8px_0_0_rgba(0,0,0,0.05)] border-2 border-slate-100 w-full max-w-2xl overflow-hidden relative">
        
        {/* TUTORIAL OVERLAY */}
        {showTutorial && (
            <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex items-center justify-center p-8">
                <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-slate-100 max-w-sm text-center">
                    <div className="mb-4 flex justify-center">
                        {level === 1 && <Zap size={48} color={colors.accent} />}
                        {level === 2 && <Shield size={48} color={colors.secondary} />}
                        {level === 3 && <Heart size={48} color={colors.danger} />}
                        {level === 4 && <RefreshCw size={48} color={colors.primary} />}
                    </div>
                    <h2 className="text-xl font-black mb-2 text-slate-800">
                        {level === 1 ? "Start with Energy" :
                         level === 2 ? "Build the Walls" :
                         level === 3 ? "Watch the Pulse" :
                         "Master the Flow"}
                    </h2>
                    <p className="text-slate-500 mb-6 leading-relaxed">
                        {level === 1 ? "Ideas are like particles. Without structure, they drift away. Use the 'Innovation' slider to add energy." :
                         level === 2 ? "Energy needs a container. Use 'Discipline' to pull your ideas into a usable orbit." :
                         level === 3 ? "Systems are alive. Too much chaos causes Stress. Too much order causes Stagnation." :
                         "You cannot stand still. Use Protocols to pulse between focused work and creative freedom."}
                    </p>
                    <button 
                        onClick={() => setShowTutorial(false)}
                        className="w-full py-3 rounded-xl font-bold text-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all"
                        style={{ backgroundColor: colors.primary }}
                    >
                        Let's Go
                    </button>
                </div>
            </div>
        )}

        {/* CANVAS */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-50 border-2 border-slate-100 h-[300px] md:h-[400px]">
             <canvas 
                ref={canvasRef} 
                width={600} 
                height={400} 
                className="w-full h-full object-cover"
             />
             
             {/* LEVEL 3+ METERS OVERLAY */}
             {level >= 3 && (
                 <div className="absolute top-4 left-4 right-4 flex gap-4 bg-white/90 p-3 rounded-2xl shadow-sm border border-slate-100 backdrop-blur">
                    <HealthMeter label="Stress" value={stress} color={colors.danger} icon={ActivityIcon} />
                    <HealthMeter label="Stagnation" value={stagnation} color={colors.dark} icon={Anchor} />
                 </div>
             )}
        </div>

      </div>

      {/* CONTROLS AREA */}
      <div className="w-full max-w-2xl mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SLIDERS CARD */}
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
            
            {/* INNOVATION SLIDER */}
            <div className="mb-6">
                <div className="flex justify-between font-bold text-slate-700 mb-2">
                    <span className="flex items-center gap-2"><Zap size={20} color={colors.accent} fill={colors.accent}/> Innovation</span>
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-lg text-xs">{innovation}</span>
                </div>
                <input 
                    type="range" min="0" max="100" value={innovation} 
                    onChange={(e) => setInnovation(parseInt(e.target.value))}
                    className="w-full h-4 bg-slate-200 rounded-full appearance-none cursor-pointer accent-yellow-400"
                    style={{ accentColor: colors.accent }}
                />
            </div>

            {/* DISCIPLINE SLIDER (LOCKED UNTIL LEVEL 2) */}
            <div className={`transition-all duration-500 ${level < 2 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <div className="flex justify-between font-bold text-slate-700 mb-2">
                    <span className="flex items-center gap-2">
                        <Anchor size={20} color={colors.secondary} /> 
                        {level < 2 ? "Discipline (Locked)" : "Discipline"}
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-xs">{discipline}</span>
                </div>
                <input 
                    type="range" min="0" max="100" value={discipline} 
                    onChange={(e) => setDiscipline(parseInt(e.target.value))}
                    className="w-full h-4 bg-slate-200 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: colors.secondary }}
                />
            </div>
        </div>

        {/* ACTION / PROGRESS CARD */}
        <div className="flex flex-col gap-4">
            
            {/* LEVEL UP BUTTON */}
            {level < 4 && (
                <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 text-center">
                    <p className="text-slate-400 text-sm font-bold mb-3 uppercase tracking-widest">Next Lesson</p>
                    <button 
                        onClick={nextLevel}
                        className="w-full py-3 rounded-2xl font-bold text-slate-700 border-2 border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        {level === 1 ? "Unlock The Container" : 
                         level === 2 ? "Unlock Biology" : "Unlock Architect Mode"}
                    </button>
                </div>
            )}

            {/* LEVEL 4 PROTOCOLS */}
            {level === 4 && (
                <div className="flex flex-col gap-3">
                     <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-2">Protocols</p>
                     <ScenarioButton 
                        title="Deep Work Sprint" 
                        color={colors.secondary} 
                        action={() => { setDiscipline(90); setInnovation(30); }} 
                     />
                     <ScenarioButton 
                        title="Creative Wander" 
                        color={colors.accent} 
                        action={() => { setDiscipline(20); setInnovation(90); }} 
                     />
                </div>
            )}
            
            {/* RESET */}
             <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center justify-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors mt-2"
            >
                {isPlaying ? <Pause size={16}/> : <Play size={16}/>} 
                {isPlaying ? "Pause" : "Resume"}
            </button>
        </div>

      </div>
    </div>
  );
};

// Simple Icon wrapper for logic
const ActivityIcon = (props) => (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
);

export default StructureSimulator;
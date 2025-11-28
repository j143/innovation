import React, { useState, useEffect, useRef } from 'react';
import { Zap, Anchor, Heart, Activity, Play, Pause, ArrowRight, Lock, Check } from 'lucide-react';

/* ==========================================================================
   THE GAME PLAN (CONFIGURATION)
   ==========================================================================
   Tweak these values to adjust game mechanics, difficulty, and visuals.
   This section serves as the "Brain" of the simulation.
*/

const GAME_CONFIG = {
  // 1. VISUAL THEME (Duolingo-inspired)
  theme: {
    colors: {
      background: '#FFFFFF',
      appBg: '#F7F7F7',
      primary: '#58CC02',    // Green (Success/Action)
      primaryDark: '#46A302',
      secondary: '#1CB0F6',  // Blue (Discipline)
      secondaryDark: '#118CC0',
      accent: '#FFC800',     // Yellow (Innovation)
      accentDark: '#E5B400',
      danger: '#FF4B4B',     // Red (Stress)
      dangerDark: '#D32F2F',
      textMain: '#4B4B4B',
      textLight: '#AFAFAF',
      border: '#E5E5E5',
      particlePalette: ['#58CC02', '#1CB0F6', '#FFC800', '#FF9600', '#CE82FF']
    },
    ui: {
      borderRadius: '20px',
      borderWidth: '2px',
      depth: '4px', // The size of the "3D" bottom border
    }
  },

  // 2. PHYSICS CONSTANTS
  physics: {
    numParticles: 60,
    baseRadius: 110,
    friction: 0.96,
    gravityStrength: 0.0006,
    innovationMultiplier: 0.25, // How much the slider impacts speed
    boundaryBounce: -0.85,
  },

  // 3. GAMEPLAY BALANCE
  mechanics: {
    stressThreshold: 5,         // Collisions required to raise stress
    stagnationThreshold: 0.8,   // Low speed required to raise stagnation
    recoveryRate: 0.3,          // How fast meters heal when condition is met
    damageRate: 0.5,            // How fast meters fill when bad things happen
  },

  // 4. LEVEL PROGRESSION (Progressive Disclosure)
  levels: {
    1: {
      title: "The Void",
      description: "In the beginning, there is only energy. Move the slider to spark ideas.",
      unlocks: ['innovation'],
      color: '#FFC800'
    },
    2: {
      title: "The Container",
      description: "Energy without direction is lost. Add Discipline to create a structure.",
      unlocks: ['innovation', 'discipline'],
      color: '#1CB0F6'
    },
    3: {
      title: "The Organism",
      description: "The system is alive. Watch for Stress (too fast) and Stagnation (too slow).",
      unlocks: ['innovation', 'discipline', 'health'],
      color: '#FF4B4B'
    },
    4: {
      title: "The Architect",
      description: "Mastery is movement. Use protocols to pulse between states.",
      unlocks: ['innovation', 'discipline', 'health', 'protocols'],
      color: '#58CC02'
    }
  }
};

/* ==========================================================================
   STYLES (CSS-IN-JS)
   ==========================================================================
   Standard CSS properties. No utility classes.
*/
const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: GAME_CONFIG.theme.colors.appBg,
    fontFamily: '"Nunito", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    color: GAME_CONFIG.theme.colors.textMain,
  },
  header: {
    width: '100%',
    maxWidth: '600px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: GAME_CONFIG.theme.colors.textLight,
  },
  card: {
    backgroundColor: GAME_CONFIG.theme.colors.background,
    borderRadius: GAME_CONFIG.theme.ui.borderRadius,
    border: `${GAME_CONFIG.theme.ui.borderWidth} solid ${GAME_CONFIG.theme.colors.border}`,
    borderBottomWidth: GAME_CONFIG.theme.ui.depth,
    padding: '20px',
    width: '100%',
    maxWidth: '600px',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  canvasContainer: {
    width: '100%',
    height: '350px',
    borderRadius: '16px',
    backgroundColor: '#F0F0F0',
    position: 'relative',
    overflow: 'hidden',
  },
  controlRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
  },
  sliderContainer: {
    width: '100%',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  rangeInput: {
    width: '100%',
    cursor: 'pointer',
    height: '10px',
    borderRadius: '5px',
    outline: 'none',
    appearance: 'none',
    backgroundColor: '#E5E5E5',
  },
  button: {
    width: '100%',
    padding: '15px',
    borderRadius: '16px',
    border: 'none',
    fontWeight: '800',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'transform 0.1s',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    color: '#FFF',
    borderBottom: `4px solid rgba(0,0,0,0.2)`,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: '40px',
    textAlign: 'center',
  },
  badge: {
    padding: '5px 12px',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '12px',
    textTransform: 'uppercase',
  }
};

/* ==========================================================================
   MAIN COMPONENT
   ==========================================================================
*/
const StructureSimulator = () => {
  // --- STATE ---
  const [level, setLevel] = useState(1);
  const [showTutorial, setShowTutorial] = useState(true);
  
  // Physics State
  const [innovation, setInnovation] = useState(50);
  const [discipline, setDiscipline] = useState(0);
  
  // Health State (Level 3+)
  const [stress, setStress] = useState(0);
  const [stagnation, setStagnation] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(true);

  // --- REFS & ENGINE ---
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const particles = useRef([]);
  const stressRef = useRef(0);
  const stagnationRef = useRef(0);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Reset or Initialize Particles
    particles.current = [];
    const { numParticles } = GAME_CONFIG.physics;
    const { particlePalette } = GAME_CONFIG.theme.colors;

    for (let i = 0; i < numParticles; i++) {
      particles.current.push({
        x: Math.random() * 400,
        y: Math.random() * 400,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 6 + 4,
        color: particlePalette[Math.floor(Math.random() * particlePalette.length)],
      });
    }
  }, []); // Run once on mount

  // --- LEVEL UP LOGIC ---
  const handleLevelUp = () => {
    if (level < 4) {
      const nextLvl = level + 1;
      setLevel(nextLvl);
      setShowTutorial(true);
      
      // Auto-set reasonable defaults for the new mechanic
      if (nextLvl === 2) setDiscipline(40);
      if (nextLvl === 3) { setStress(0); setStagnation(0); }
    }
  };

  // --- PHYSICS LOOP ---
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const config = GAME_CONFIG;
    
    // 1. CLEAR
    ctx.clearRect(0, 0, width, height);
    
    // 2. BACKGROUND FEEDBACK (Stress/Stagnation Tints)
    if (level >= 3) {
      if (stressRef.current > 50) {
        ctx.fillStyle = `rgba(255, 75, 75, ${stressRef.current / 600})`;
        ctx.fillRect(0, 0, width, height);
      }
      if (stagnationRef.current > 50) {
        ctx.fillStyle = `rgba(100, 100, 100, ${stagnationRef.current / 500})`;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // 3. DRAW CONTAINER (Level 2+)
    const baseR = config.physics.baseRadius;
    // Container gets tighter as discipline increases
    const containerR = baseR + (100 - discipline) * 0.5;

    if (level >= 2) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, containerR, 0, Math.PI * 2);
      
      // Styling the container
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#E0E0E0'; // Base ring
      ctx.stroke();

      // Active Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, containerR, 0, Math.PI * 2);
      
      if (stressRef.current > 80 && level >= 3) {
        ctx.strokeStyle = config.theme.colors.danger;
        ctx.setLineDash([15, 10]); // "Cracking" effect
      } else {
        ctx.strokeStyle = config.theme.colors.secondary;
        ctx.setLineDash([]);
      }
      
      // If discipline is 0, make it effectively invisible/ghostly
      ctx.globalAlpha = Math.max(0.1, discipline / 100);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      ctx.setLineDash([]);
    }

    // 4. PARTICLES
    let collisions = 0;
    let totalSpeed = 0;

    particles.current.forEach(p => {
      // A. INNOVATION (Velocity)
      const speedMult = 0.5 + (innovation * config.physics.innovationMultiplier / 10);
      const jitter = innovation / 150;

      p.vx += (Math.random() - 0.5) * jitter;
      p.vy += (Math.random() - 0.5) * jitter;

      // B. DISCIPLINE (Gravity) - Only if unlocked
      if (level >= 2 && discipline > 5) {
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const gravity = discipline * config.physics.gravityStrength;
        p.vx += dx * gravity;
        p.vy += dy * gravity;
      }

      // C. FRICTION
      p.vx *= config.physics.friction;
      p.vy *= config.physics.friction;

      // D. MOVE
      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;
      
      totalSpeed += Math.abs(p.vx) + Math.abs(p.vy);

      // E. BOUNDARIES
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx*dx + dy*dy);

      // Container Collision (Level 2+)
      if (level >= 2 && discipline > 15) {
        if (dist + p.size > containerR) {
          const angle = Math.atan2(dy, dx);
          // Snap back
          p.x = centerX + Math.cos(angle) * (containerR - p.size);
          p.y = centerY + Math.sin(angle) * (containerR - p.size);
          
          // Bounce
          p.vx *= config.physics.boundaryBounce;
          p.vy *= config.physics.boundaryBounce;
          
          // Check impact for Stress
          const impact = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
          if (impact > 2) collisions++;
        }
      } else {
        // Wrap-around (The Void)
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      }

      // F. DRAW
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      
      // Greyscale if stagnated
      if (level >= 3 && stagnationRef.current > 70) {
        ctx.fillStyle = '#CCCCCC';
      } else {
        ctx.fillStyle = p.color;
      }
      ctx.fill();
      
      // Shine
      ctx.beginPath();
      ctx.arc(p.x - p.size*0.3, p.y - p.size*0.3, p.size/3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();
    });

    // 5. GAME LOGIC UPDATES (Level 3+)
    if (level >= 3) {
      // Stress Calculation
      if (collisions > config.mechanics.stressThreshold) {
        stressRef.current = Math.min(100, stressRef.current + config.mechanics.damageRate);
      } else {
        stressRef.current = Math.max(0, stressRef.current - config.mechanics.recoveryRate);
      }

      // Stagnation Calculation
      const avgSpeed = totalSpeed / config.physics.numParticles;
      if (avgSpeed < config.mechanics.stagnationThreshold) {
        stagnationRef.current = Math.min(100, stagnationRef.current + config.mechanics.damageRate);
      } else {
        stagnationRef.current = Math.max(0, stagnationRef.current - config.mechanics.recoveryRate);
      }

      // Sync to React State (Throttled random check to avoid 60fps re-renders)
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


  // --- SUB-COMPONENTS ---

  const Slider = ({ label, val, setVal, color, locked }) => (
    <div style={{...styles.sliderContainer, opacity: locked ? 0.5 : 1}}>
      <div style={styles.labelRow}>
        <span style={{display:'flex', alignItems:'center', gap: '8px', color: GAME_CONFIG.theme.colors.textMain}}>
          {locked && <Lock size={14}/>} {label}
        </span>
        <span style={{color: color}}>{val}</span>
      </div>
      <input 
        type="range" min="0" max="100" value={val}
        onChange={(e) => !locked && setVal(parseInt(e.target.value))}
        disabled={locked}
        style={{
          ...styles.rangeInput,
          background: `linear-gradient(to right, ${color} ${val}%, #E5E5E5 ${val}%)`
        }}
      />
    </div>
  );

  const HealthBar = ({ label, val, color }) => (
    <div style={{width: '100%'}}>
      <div style={{...styles.labelRow, fontSize:'12px', color: GAME_CONFIG.theme.colors.textLight, textTransform: 'uppercase'}}>
        <span>{label}</span>
        <span>{val}%</span>
      </div>
      <div style={{width: '100%', height:'12px', backgroundColor: '#E5E5E5', borderRadius:'6px', overflow:'hidden'}}>
        <div style={{
          width: `${val}%`, 
          height:'100%', 
          backgroundColor: color, 
          transition: 'width 0.2s'
        }}/>
      </div>
    </div>
  );

  const ProtocolButton = ({ title, color, onClick }) => (
    <button 
      onClick={onClick}
      style={{
        ...styles.button,
        backgroundColor: color,
        borderBottomColor: `${color}88`, // simple darken
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <span>{title}</span>
    </button>
  );

  // --- RENDER ---
  const currentLevelConfig = GAME_CONFIG.levels[level];

  return (
    <div style={styles.app}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <span style={{color: GAME_CONFIG.theme.colors.textLight, fontSize:'12px', fontWeight:'bold', textTransform:'uppercase'}}>SIMULATOR</span>
          <div style={styles.title}>Structure<span style={{color: GAME_CONFIG.theme.colors.primary}}>OS</span></div>
        </div>
        <div style={{
          ...styles.badge, 
          backgroundColor: currentLevelConfig.color, 
          color: '#FFF'
        }}>
          Lvl {level}: {currentLevelConfig.title}
        </div>
      </div>

      {/* VISUALIZATION CARD */}
      <div style={styles.card}>
        
        {/* Tutorial Overlay */}
        {showTutorial && (
          <div style={styles.overlay}>
             <div style={{marginBottom:'20px'}}>
               {level === 1 && <Zap size={60} color={GAME_CONFIG.theme.colors.accent} />}
               {level === 2 && <Anchor size={60} color={GAME_CONFIG.theme.colors.secondary} />}
               {level === 3 && <Activity size={60} color={GAME_CONFIG.theme.colors.danger} />}
               {level === 4 && <Check size={60} color={GAME_CONFIG.theme.colors.primary} />}
             </div>
             <h2 style={{fontSize:'24px', fontWeight:'800', marginBottom:'10px'}}>
               {currentLevelConfig.title}
             </h2>
             <p style={{lineHeight:'1.5', color:'#666', marginBottom:'30px'}}>
               {currentLevelConfig.description}
             </p>
             <button 
               onClick={() => setShowTutorial(false)}
               style={{...styles.button, backgroundColor: GAME_CONFIG.theme.colors.primary, width:'auto', padding:'15px 40px'}}
             >
               I'M READY
             </button>
          </div>
        )}

        {/* Canvas */}
        <div style={styles.canvasContainer}>
          <canvas 
            ref={canvasRef}
            width={600}
            height={400}
            style={{width:'100%', height:'100%', objectFit:'contain'}}
          />
          
          {/* Level 3+ HUD */}
          {level >= 3 && !showTutorial && (
            <div style={{
              position:'absolute', top:'10px', left:'10px', right:'10px', 
              display:'flex', gap:'10px', backgroundColor:'rgba(255,255,255,0.9)', 
              padding:'10px', borderRadius:'12px', border:`2px solid #EEE`
            }}>
              <HealthBar label="Stress" val={stress} color={GAME_CONFIG.theme.colors.danger} />
              <HealthBar label="Stagnation" val={stagnation} color={GAME_CONFIG.theme.colors.textMain} />
            </div>
          )}
        </div>
      </div>

      {/* CONTROLS CARD */}
      <div style={styles.card}>
        <div style={styles.controlRow}>
          {/* Innovation Slider (Always Unlocked) */}
          <Slider 
            label="Innovation (Energy)" 
            val={innovation} 
            setVal={setInnovation} 
            color={GAME_CONFIG.theme.colors.accent}
            locked={false}
          />
          
          {/* Discipline Slider (Unlock Lvl 2) */}
          <Slider 
            label="Discipline (Container)" 
            val={discipline} 
            setVal={setDiscipline} 
            color={GAME_CONFIG.theme.colors.secondary} 
            locked={level < 2}
          />
        </div>

        {/* Level 4 Protocols */}
        {level >= 4 && (
           <div style={{display:'flex', gap:'10px', marginTop:'20px', borderTop:'2px solid #EEE', paddingTop:'20px'}}>
              <ProtocolButton 
                title="Deep Work Sprint" 
                color={GAME_CONFIG.theme.colors.secondary}
                onClick={() => { setInnovation(30); setDiscipline(90); }}
              />
              <ProtocolButton 
                title="Brainstorm" 
                color={GAME_CONFIG.theme.colors.accent}
                onClick={() => { setInnovation(90); setDiscipline(20); }}
              />
           </div>
        )}

        {/* Progress / Play Controls */}
        <div style={{marginTop:'30px', display:'flex', gap:'10px'}}>
           {level < 4 && (
             <button 
               onClick={handleLevelUp}
               style={{...styles.button, backgroundColor: '#FFF', color: GAME_CONFIG.theme.colors.textMain, border:`2px solid ${GAME_CONFIG.theme.colors.border}`, borderBottomWidth:'4px'}}
             >
               Next Level <ArrowRight size={16}/>
             </button>
           )}
           <button 
             onClick={() => setIsPlaying(!isPlaying)}
             style={{...styles.button, backgroundColor: '#FFF', color: GAME_CONFIG.theme.colors.textLight, border:'2px solid #F0F0F0', borderBottomWidth:'4px', width: level < 4 ? '60px' : '100%'}}
           >
             {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
           </button>
        </div>
      </div>

    </div>
  );
};

export default StructureSimulator;
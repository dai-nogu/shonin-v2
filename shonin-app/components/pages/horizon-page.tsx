"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import {
  Stars,
  OrbitControls,
  Float,
  Text,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  History, 
  MessageSquare, 
  Menu, 
  Maximize2,
  Mail,
  Activity,
  Radio,
  Sparkles
} from "lucide-react";

// --- Constants & Types ---
const THEME_COLOR = "#A5F3FC"; // Cyan-200 equivalent
const GLOW_COLOR = "#22D3EE"; // Cyan-400 equivalent
const BG_COLOR = "#020409";

// --- 3D Components ---

function MoonMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Load textures using useLoader for better Next.js compatibility
  const colorMap = useLoader(THREE.TextureLoader, "/textures/moon_map.jpg");
  const normalMap = useLoader(THREE.TextureLoader, "/textures/moon_elevation.jpg");

  // Configure textures for better quality
  React.useEffect(() => {
    if (colorMap) {
      colorMap.anisotropy = 16; // Better texture quality at angles
    }
    if (normalMap) {
      normalMap.anisotropy = 16;
    }
  }, [colorMap, normalMap]);

  // 回転なし

  return (
    <group>
      {/* Main Moon Body */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[3, 128, 128]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={normalMap}
          bumpScale={0.03}
          roughness={0.95}
          metalness={0}
          color="#ffffff"
        />
      </mesh>
      
      {/* Main Light - 正面から照らす（満月効果） */}
      <directionalLight position={[0, 0, 10]} intensity={3} color="#ffffff" />
      
      {/* Additional lights for depth and detail */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#ffffff" distance={20} />
      <pointLight position={[-5, 5, 5]} intensity={1} color="#ffffff" distance={20} />
    </group>
  );
}

// Fallback Moon without textures
function MoonFallback() {
  const meshRef = useRef<THREE.Mesh>(null);

  // 回転なし

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[3, 64, 64]} />
        <meshStandardMaterial
          color="#E0F2FE"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      <pointLight position={[-5, 2, -5]} intensity={2} color="#4FFFB0" distance={20} />
      <pointLight position={[5, -2, 5]} intensity={1} color="#00BFFF" distance={20} />
    </group>
  );
}

function Moon() {  
  return (
    <React.Suspense fallback={<MoonFallback />}>
      <MoonMesh />
    </React.Suspense>
  );
}

function OrbitParticles({ count = 800, radius = 3.5 }) {
  const points = useRef<THREE.Points>(null);

  // Generate particles in a ring/orbit
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Distribute in a ring with some thickness
      const r = radius + (Math.random() - 0.5) * 0.5; 
      // Add some vertical spread for 3D feel
      const y = (Math.random() - 0.5) * 0.5; 
      
      temp[i * 3] = Math.cos(angle) * r;     // x
      temp[i * 3 + 1] = Math.sin(angle) * r * 0.2 + y; // y (tilted slightly)
      temp[i * 3 + 2] = Math.sin(angle) * r; // z
    }
    return temp;
  }, [count, radius]);

  // 回転なし

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color={THEME_COLOR}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
      />
    </points>
  );
}

function FloatingText({ text, position, fontSize = 0.1 }: { text: string; position: [number, number, number]; fontSize?: number }) {
    return (
        <Text
            position={position}
            fontSize={fontSize}
            color={THEME_COLOR}
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff" // Use a standard font url or local
        >
            {text}
        </Text>
    )
}


function SceneContent() {
  const { camera } = useThree();
  
  // Mouse parallax effect could go here
  
  return (
    <>
      {/* Ambient lighting for overall scene - reduced to let moon textures show */}
      <ambientLight intensity={0.15} />
      
      {/* Background Stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <Moon />
      </Float>

      <group rotation={[0.4, 0, 0.2]}>
         <OrbitParticles radius={3.2} count={600} />
         <OrbitParticles radius={4.5} count={300} />
      </group>
    </>
  );
}

// --- UI Components ---

function Header() {
    return (
        <header className="fixed top-0 left-0 w-full p-8 z-10 flex justify-between items-start pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto cursor-pointer">
                <div className="w-8 h-8 rounded-full border border-[#4FFFB0] flex items-center justify-center">
                    <div className="w-4 h-4 bg-[#4FFFB0] rounded-sm transform rotate-45"></div>
                </div>
                <h1 className="text-2xl font-light tracking-[0.2em] text-white font-sans">
                    SHONIN
                </h1>
            </div>
            
             <div className="text-[#4FFFB0]/60 text-xs tracking-widest border border-[#4FFFB0]/30 px-3 py-1 rounded-full">
                SYSTEM OPTIMAL
            </div>
        </header>
    )
}

function Sidebar() {
    const menuItems = [
        { icon: <Activity size={20} />, label: "HORIZON", active: true },
        { icon: <History size={20} />, label: "HISTORY", active: false },
        { icon: <Radio size={20} />, label: "ORBIT", active: false },
        { icon: <MessageSquare size={20} />, label: "MESSENGER", active: false },
    ];

    return (
        <nav className="fixed left-0 top-1/2 -translate-y-1/2 p-8 z-10 hidden md:flex flex-col gap-12 pointer-events-none">
            {menuItems.map((item, index) => (
                <div key={index} className={`flex items-center gap-4 group pointer-events-auto cursor-pointer transition-all duration-300 ${item.active ? 'opacity-100 translate-x-2' : 'opacity-50 hover:opacity-100 hover:translate-x-1'}`}>
                    <div className={`text-[#4FFFB0] transition-transform duration-300 ${item.active ? 'scale-110' : 'scale-100'}`}>
                        {item.icon}
                    </div>
                    <span className="text-white text-xs tracking-[0.2em] font-light">
                        {item.label}
                    </span>
                    {item.active && (
                         <motion.div 
                            layoutId="active-indicator"
                            className="absolute -left-4 w-1 h-1 bg-[#4FFFB0] rounded-full shadow-[0_0_10px_#4FFFB0]"
                         />
                    )}
                </div>
            ))}
        </nav>
    );
}

function CenterOverlay() {
    const [time, setTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="text-center">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-[#4FFFB0] tracking-[0.3em] text-sm mb-4 font-light uppercase"
                    style={{ 
                        textShadow: "0 2px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(79, 255, 176, 0.5)" 
                    }}
                >
                    Orbit
                </motion.div>
                
                <motion.div
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: 0.8, duration: 0.8 }}
                     className="relative"
                >
                    <h1 
                        className="text-white text-8xl font-light tracking-tighter mb-2" 
                        style={{ 
                            textShadow: "0 4px 20px rgba(0, 0, 0, 0.9), 0 8px 40px rgba(0, 0, 0, 0.7), 0 0 60px rgba(79, 255, 176, 0.2)" 
                        }}
                    >
                        {time}
                    </h1>
                    <div 
                        className="text-white/90 text-xl tracking-[0.2em] font-light mb-6"
                        style={{ 
                            textShadow: "0 2px 10px rgba(0, 0, 0, 0.8), 0 4px 20px rgba(0, 0, 0, 0.6)" 
                        }}
                    >
                        DEEP FOCUS
                    </div>
                    <div 
                        className="text-[#4FFFB0] text-xs tracking-widest mb-12"
                        style={{ 
                            textShadow: "0 2px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(79, 255, 176, 0.5)" 
                        }}
                    >
                        LUMINOSITY +1.5%
                    </div>
                </motion.div>

                <motion.button 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="pointer-events-auto px-8 py-3 border border-[#4FFFB0]/50 text-[#4FFFB0] text-xs tracking-[0.2em] hover:bg-[#4FFFB0]/10 hover:border-[#4FFFB0] transition-all duration-300 uppercase relative overflow-hidden group"
                >
                    <span className="relative z-10">Trace to Begin</span>
                    <div className="absolute inset-0 bg-[#4FFFB0]/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                </motion.button>
            </div>
        </div>
    );
}

function RightPanel() {
    return (
        <div className="fixed right-12 top-1/2 -translate-y-1/2 z-10 pointer-events-none hidden md:block">
            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 right-full w-24 h-[1px] bg-gradient-to-l from-[#4FFFB0]/50 to-transparent mr-4"></div>
                <div className="absolute top-1/2 right-full w-2 h-2 border border-[#4FFFB0] rounded-full mr-4 -translate-y-1/2 bg-[#020409]"></div>
                
                <div className="flex flex-col items-center pointer-events-auto">
                    <div className="w-16 h-16 border border-[#4FFFB0] flex items-center justify-center mb-4 relative group cursor-pointer hover:bg-[#4FFFB0]/10 transition-colors">
                        <Mail className="text-[#4FFFB0]" size={24} />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#4FFFB0] animate-pulse"></div>
                    </div>
                    <div className="text-center">
                        <div className="text-[#4FFFB0] text-xs tracking-[0.2em] mb-1">MESSENGER</div>
                        <div className="text-white/60 text-[10px] tracking-widest">UNOPENED LETTER FROM SHONIN</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Footer() {
    return (
        <footer className="fixed bottom-0 left-0 w-full p-8 z-10 flex justify-between items-end pointer-events-none">
             <div className="flex items-center gap-4 pointer-events-auto group cursor-pointer">
                 <div className="relative w-12 h-12">
                    {/* Simplified Constellation Graph */}
                    <svg viewBox="0 0 100 100" className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity">
                        <path d="M20,80 L40,60 L70,70 L80,30 L50,20 L30,40 Z" fill="none" stroke="#4FFFB0" strokeWidth="2" />
                        <circle cx="20" cy="80" r="3" fill="#fff" />
                        <circle cx="40" cy="60" r="3" fill="#fff" />
                        <circle cx="70" cy="70" r="3" fill="#fff" />
                        <circle cx="80" cy="30" r="3" fill="#fff" />
                        <circle cx="50" cy="20" r="3" fill="#fff" />
                        <circle cx="30" cy="40" r="3" fill="#fff" />
                    </svg>
                 </div>
                 <div className="text-white/40 text-[10px] tracking-[0.2em] group-hover:text-white/80 transition-colors">
                     WEEKLY CONSTELLATION
                 </div>
             </div>
             
             <div className="text-white/20 text-[10px] tracking-widest">
                 CO-EXIST
             </div>
        </footer>
    )
}

export function HorizonPage() {
  return (
    <div className="relative w-full h-screen bg-[#020409] overflow-hidden selection:bg-[#4FFFB0]/30">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
          <SceneContent />
        </Canvas>
      </div>

      {/* Decorative Border Frame */}
      <div className="fixed inset-4 border border-[#4FFFB0]/20 pointer-events-none z-20 rounded-sm">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#4FFFB0]"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#4FFFB0]"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#4FFFB0]"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#4FFFB0]"></div>
      </div>

      {/* UI Layers */}
      <Header />
      <Sidebar />
      <CenterOverlay />
      <RightPanel />
      <Footer />
      
      {/* Screen Effects */}
      <div className="absolute inset-0 pointer-events-none z-30" 
           style={{
               background: "radial-gradient(circle at center, transparent 0%, #020409 120%)",
           }}
      />
      <div className="absolute inset-0 pointer-events-none z-30 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
    </div>
  );
}

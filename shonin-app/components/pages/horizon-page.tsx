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
  Sparkles,
  Archive,
  Volume2,
  Eye,
  Target,
  X,
  Smile,
  Meh,
  Frown,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import { getActiveGoals } from "@/app/actions/goals";
import type { Database } from "@/types/database";
import { useSessions, type CompletedSession } from "@/contexts/sessions-context";
import { useActivities } from "@/contexts/activities-context";
import { Goals } from "@/components/pages/goals";
import { useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/common/dialog";
import { Input } from "@/components/ui/common/input";
import { Label } from "@/components/ui/common/label";
import { Button } from "@/components/ui/common/button";
import { GoalTitleInput } from "@/components/ui/goals/goal-title-input";
import { GoalDontDoSelector } from "@/components/ui/goals/goal-dont-do-selector";
import { GoalHoursInputs } from "@/components/ui/goals/goal-hours-inputs";
import { useGoalForm } from "@/hooks/use-goal-form";
import { useGoalsDb, type GoalFormData as DbGoalFormData } from "@/hooks/use-goals-db";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/common/select";

// --- Constants & Types ---
const THEME_COLOR = "#A5F3FC"; // Orbit particles color

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

// セッションの記録データ型
interface SessionMemory {
  id: string;
  angle: number;
  radius: number;
  time: string;
  memory: string;
  color: string;
}

function OrbitParticles({ 
  count = 800, 
  radius = 3.5, 
  sessionMemories = [],
  onParticleHover
}: { 
  count?: number; 
  radius?: number; 
  sessionMemories?: SessionMemory[];
  onParticleHover?: (memory: SessionMemory | null) => void;
}) {
  const points = useRef<THREE.Points>(null);
  const { camera, raycaster, pointer } = useThree();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  // Session memory particles
  const memoryParticles = useMemo(() => {
    return sessionMemories.map(mem => {
      const x = Math.cos(mem.angle) * mem.radius;
      const y = Math.sin(mem.angle) * mem.radius * 0.2;
      const z = Math.sin(mem.angle) * mem.radius;
      return { ...mem, position: new THREE.Vector3(x, y, z) };
    });
  }, [sessionMemories]);

  return (
    <group>
      {/* Background orbit particles */}
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
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

      {/* Session memory particles - larger and interactive */}
      {memoryParticles.map((mem, index) => (
        <mesh
          key={mem.id}
          position={mem.position}
          onPointerEnter={() => {
            setHoveredIndex(index);
            onParticleHover?.(mem);
          }}
          onPointerLeave={() => {
            setHoveredIndex(null);
            onParticleHover?.(null);
          }}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial
            color={mem.color}
            transparent
            opacity={hoveredIndex === index ? 1 : 0.8}
            blending={THREE.AdditiveBlending}
          />
          {hoveredIndex === index && (
            <pointLight color={mem.color} intensity={2} distance={2} />
          )}
        </mesh>
      ))}
    </group>
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


function SceneContent({ sessionMemories, onMemoryHover }: { 
  sessionMemories: SessionMemory[];
  onMemoryHover: (memory: SessionMemory | null) => void;
}) {
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
         <OrbitParticles 
           radius={3.2} 
           count={600} 
         />
         <OrbitParticles 
           radius={4.5} 
           count={300} 
           sessionMemories={sessionMemories}
           onParticleHover={onMemoryHover}
         />
      </group>
    </>
  );
}

// --- UI Components ---

function Header({ isHidden }: { isHidden: boolean }) {
    return (
        <motion.header 
            initial={{ opacity: 1 }}
            animate={{ opacity: isHidden ? 0 : 1 }}
            transition={{ duration: 0.8 }}
            className="fixed top-0 left-0 w-full p-8 z-10 flex justify-between items-start pointer-events-none"
        >
            <div className="flex items-center gap-3 pointer-events-auto cursor-pointer">
                <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: '#4FFFB0' }}>
                    <div className="w-4 h-4 rounded-sm transform rotate-45" style={{ backgroundColor: '#4FFFB0' }}></div>
                </div>
                <h1 style={{ fontSize: '24px', letterSpacing: '0.2em', color: '#dbdbdb' }}>
                    SHONIN
                </h1>
            </div>
            
            <div style={{ color: '#dbdbdb', fontSize: '12px', letterSpacing: '0.1em', border: '1px solid #4FFFB0', padding: '4px 12px', borderRadius: '9999px' }}>
                SYSTEM OPTIMAL
            </div>
        </motion.header>
    )
}

function Sidebar({ isHidden, onMessengerClick, onGoalsClick }: { 
  isHidden: boolean; 
  onMessengerClick: () => void;
  onGoalsClick: () => void;
}) {
    const menuItems = [
        { icon: <Eye size={22} />, label: "HORIZON", active: true, description: "観測画面", onClick: undefined },
        { icon: <Archive size={22} />, label: "CHRONICLE", active: false, description: "銀河アーカイブ", onClick: undefined },
        { icon: <MessageSquare size={22} />, label: "MESSENGER", active: false, description: "証人からの手紙", onClick: onMessengerClick },
        { icon: <Target size={22} />, label: "GOALS", active: false, description: "目標設定", onClick: onGoalsClick },
    ];

    return (
        <motion.nav 
            initial={{ opacity: 1 }}
            animate={{ opacity: isHidden ? 0 : 1 }}
            transition={{ duration: 0.8 }}
            className="fixed left-0 top-1/2 -translate-y-1/2 p-8 z-10 hidden md:flex flex-col gap-12 pointer-events-none"
        >
            {menuItems.map((item, index) => (
                <div 
                    key={index}
                    onClick={item.onClick}
                    className="flex items-center gap-4 pointer-events-auto transition-all duration-300 hover:translate-x-1"
                    style={{
                        cursor: item.onClick ? 'pointer' : (item.active ? 'default' : 'not-allowed'),
                        opacity: item.active ? 1 : (item.onClick ? 0.7 : 0.5)
                    }}
                >
                    <div style={{ color: '#4FFFB0' }}>
                        {item.icon}
                    </div>
                    <div className="flex flex-col">
                        <span style={{ color: '#dbdbdb', fontSize: '14px', letterSpacing: '0.2em', marginBottom: '4px' }}>
                            {item.label}
                        </span>
                        <span style={{ color: '#dbdbdb', fontSize: '11px', letterSpacing: '0.05em' }}>
                            {item.description}
                        </span>
                    </div>
                    {item.active && (
                         <motion.div 
                            layoutId="active-indicator"
                            className="absolute -left-4 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: '#4FFFB0', boxShadow: '0 0 12px #4FFFB0' }}
                         />
                    )}
                </div>
            ))}
        </motion.nav>
    );
}

function CenterOverlay({ 
    step, 
    onStartClick, 
    onGoalSelect,
    onActivitySelect,
    onReflectionSave,
    onReflectionSkip,
    onEndSession,
    sessionTime, 
    selectedGoalTitle,
    goalsCache,
    goalsCacheLoaded,
    newGoalTitle,
    onNewGoalTitleChange,
    newGoalDontDo,
    onNewGoalDontDoChange,
    onGoalInputNext,
    onActivityCreateNext,
    onGoalCreateComplete,
    onGoalCreateCancel,
    onRefreshCache
}: { 
    step: FlowStep;
    onStartClick: () => void;
    onGoalSelect: (goal: Goal | null) => void;
    onActivitySelect: (activity: { id: string; name: string; icon: string | null; color: string } | null) => void;
    onReflectionSave: (data: { moodScore: number; reflection: string }) => void;
    onReflectionSkip: () => void;
    onEndSession: () => void;
    sessionTime: string;
    selectedGoalTitle?: string;
    goalsCache?: Goal[];
    goalsCacheLoaded?: boolean;
    newGoalTitle: string;
    onNewGoalTitleChange: (title: string) => void;
    newGoalDontDo: string[];
    onNewGoalDontDoChange: (tags: string[]) => void;
    onGoalInputNext: () => void;
    onActivityCreateNext: () => void;
    onGoalCreateComplete: () => void;
    onGoalCreateCancel: () => void;
    onRefreshCache: () => void;
}) {
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
        <div className={`fixed inset-0 ${step === 'session-active' ? 'pointer-events-none' : 'pointer-events-none'} flex items-center justify-center z-10`}>
            <AnimatePresence mode="wait">
                {step === 'idle' && (
                    <motion.div 
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <motion.div
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: 0.8, duration: 0.8 }}
                             className="relative"
                        >
                            <h1 
                                className="text-white text-8xl font-light tracking-tighter mb-12" 
                                style={{ 
                                    textShadow: "0 4px 20px rgba(0, 0, 0, 0.9), 0 8px 40px rgba(0, 0, 0, 0.7), 0 0 60px rgba(79, 255, 176, 0.2)" 
                                }}
                            >
                                {time}
                            </h1>
                        </motion.div>

                        <motion.button 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            onClick={onStartClick}
                            className="pointer-events-auto px-12 py-4 border border-[#4FFFB0]/40 text-white text-3xl font-light tracking-[0.3em] hover:bg-[#4FFFB0]/10 hover:border-[#4FFFB0] hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                            style={{ 
                                textShadow: "0 4px 20px rgba(0, 0, 0, 0.9), 0 8px 40px rgba(0, 0, 0, 0.7), 0 0 40px rgba(79, 255, 176, 0.2)",
                                backdropFilter: "blur(4px)"
                            }}
                        >
                            <span className="relative z-10">
                                START
                            </span>
                            <div className="absolute inset-0 bg-[#4FFFB0]/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                        </motion.button>
                    </motion.div>
                )}

                {step === 'goal-select' && (
                    <motion.div
                        key="goal-select"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="pointer-events-auto"
                    >
                        <GoalSelectScreen 
                            onSelect={onGoalSelect}
                            cachedGoals={goalsCache}
                            cacheLoaded={goalsCacheLoaded}
                        />
                    </motion.div>
                )}

                {step === 'activity-select' && (
                    <motion.div
                        key="activity-select"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="pointer-events-auto"
                    >
                        <ActivitySelectScreen 
                            goalTitle={selectedGoalTitle}
                            onSelect={onActivitySelect}
                        />
                    </motion.div>
                )}

                {step === 'session-active' && (
                    <motion.div
                        key="session-active"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <motion.div
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: 0.3, duration: 0.8 }}
                             className="relative"
                        >
                            <h1 
                                className="text-white text-8xl font-light tracking-tighter mb-12" 
                                style={{ 
                                    textShadow: "0 4px 20px rgba(0, 0, 0, 0.9), 0 8px 40px rgba(0, 0, 0, 0.7), 0 0 80px rgba(79, 255, 176, 0.4)" 
                                }}
                            >
                                {sessionTime}
                            </h1>
                        </motion.div>

                        <motion.button 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            onClick={onEndSession}
                            className="pointer-events-auto px-12 py-4 border border-[#4FFFB0]/40 text-white text-3xl font-light tracking-[0.3em] hover:bg-[#4FFFB0]/10 hover:border-[#4FFFB0] hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                            style={{ 
                                textShadow: "0 4px 20px rgba(0, 0, 0, 0.9), 0 8px 40px rgba(0, 0, 0, 0.7), 0 0 40px rgba(79, 255, 176, 0.2)",
                                backdropFilter: "blur(4px)"
                            }}
                        >
                            <span className="relative z-10">
                                END
                            </span>
                            <div className="absolute inset-0 bg-[#4FFFB0]/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                        </motion.button>
                    </motion.div>
                )}

                {step === 'reflection' && (
                    <motion.div
                        key="reflection"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="pointer-events-auto"
                    >
                        <ReflectionScreen 
                            sessionTime={sessionTime}
                            onSave={onReflectionSave}
                            onSkip={onReflectionSkip}
                        />
                    </motion.div>
                )}

                {step === 'goal-create-input' && (
                    <motion.div
                        key="goal-create-input"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="pointer-events-auto"
                    >
                        <GoalInputScreen
                            goalTitle={newGoalTitle}
                            onTitleChange={onNewGoalTitleChange}
                            dontDoTags={newGoalDontDo}
                            onDontDoChange={onNewGoalDontDoChange}
                            onNext={onGoalInputNext}
                            onCancel={onGoalCreateCancel}
                        />
                    </motion.div>
                )}

                {step === 'goal-create-activity' && (
                    <motion.div
                        key="goal-create-activity"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="pointer-events-auto"
                    >
                        <ActivityCreateScreen
                            goalTitle={newGoalTitle}
                            onNext={onActivityCreateNext}
                            onCancel={onGoalCreateCancel}
                            onRefresh={onRefreshCache}
                        />
                    </motion.div>
                )}

                {step === 'goal-create-confirm' && (
                    <motion.div
                        key="goal-create-confirm"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="pointer-events-auto"
                    >
                        <GoalConfirmScreen
                            goalTitle={newGoalTitle}
                            dontDoTags={newGoalDontDo}
                            onComplete={onGoalCreateComplete}
                            onCancel={onGoalCreateCancel}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function RightConstellation() {
    return (
        <div className="fixed right-12 top-1/2 -translate-y-1/2 z-10 pointer-events-none hidden md:block">
            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-full w-24 h-[1px] ml-4" style={{ background: 'linear-gradient(to right, #fff, transparent)' }}></div>
                <div className="absolute top-1/2 left-full w-2 h-2 border rounded-full ml-4 -translate-y-1/2" style={{ borderColor: '#fff', backgroundColor: '#000' }}></div>
                
                <div className="flex flex-col items-center pointer-events-auto cursor-pointer">
                    <div className="relative w-16 h-16 mb-3">
                        {/* Simplified Constellation Graph */}
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <path d="M20,80 L40,60 L70,70 L80,30 L50,20 L30,40 Z" fill="none" stroke="#fff" strokeWidth="2" />
                            <circle cx="20" cy="80" r="3" fill="#fff" />
                            <circle cx="40" cy="60" r="3" fill="#fff" />
                            <circle cx="70" cy="70" r="3" fill="#fff" />
                            <circle cx="80" cy="30" r="3" fill="#fff" />
                            <circle cx="50" cy="20" r="3" fill="#fff" />
                            <circle cx="30" cy="40" r="3" fill="#fff" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <div style={{ color: '#dbdbdb', fontSize: '12px', letterSpacing: '0.2em', marginBottom: '4px', cursor: 'pointer' }}>CONSTELLATION</div>
                        <div style={{ color: '#dbdbdb', fontSize: '10px', letterSpacing: '0.15em', cursor: 'pointer' }}>
                            WEEKLY PROGRESS
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MessengerModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="relative w-full h-full flex items-center justify-center p-8"
    >
      {/* 閉じるボタン */}
      <button
        onClick={onClose}
        className="absolute top-8 right-8 text-white hover:text-[#4FFFB0] transition-colors duration-300 z-50"
        style={{
          fontSize: '14px',
          letterSpacing: '0.2em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <X size={24} />
        CLOSE
      </button>

      {/* メッセージコンテンツ */}
      <div className="max-w-4xl w-full space-y-8">
        {/* 週次メッセージ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-[#4FFFB0]/30 p-8 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[#4FFFB0] text-xl tracking-[0.2em] mb-2">WEEKLY LETTER</h3>
              <p className="text-gray-400 text-sm tracking-[0.1em]">週次メッセージ</p>
            </div>
            <div className="text-gray-500 text-sm tracking-[0.15em]">
              2024.12.24
            </div>
          </div>
          <div className="text-white text-base leading-relaxed tracking-[0.05em]">
            <p className="mb-4">
              この一週間、あなたは13.6時間にわたって3つの大切な目標に取り組みました。
              特に「瞑想の習慣化」では、毎日欠かさず記録を続けています。
            </p>
            <p className="mb-4">
              According to Confirmation Bias、あなたが「間違えたら情報が増える」「判断が改善って実装」と考えているのは、成長への意識の表れです。
            </p>
            <p className="text-gray-300">
              月曜日のキックオフを続けながら、「早起きで夜更かし」という習慣を見直すことで、
              さらに自分中心の成長を実感できるでしょう。
            </p>
          </div>
        </motion.div>

        {/* 月次メッセージ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border border-[#22D3EE]/30 p-8 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[#22D3EE] text-xl tracking-[0.2em] mb-2">MONTHLY LETTER</h3>
              <p className="text-gray-400 text-sm tracking-[0.1em]">月次メッセージ</p>
            </div>
            <div className="text-gray-500 text-sm tracking-[0.15em]">
              2024.12.01
            </div>
          </div>
          <div className="text-white text-base leading-relaxed tracking-[0.05em]">
            <p className="mb-4">
              12月、あなたは54時間の努力を積み重ねました。
              この時間は、確実にあなたの成長の軌跡として刻まれています。
            </p>
            <p className="mb-4">
              継続することの価値を伝えます。毎日の小さな一歩が、
              やがて大きな変化を生み出します。
            </p>
            <p className="text-gray-300">
              来月も、あなたの努力の証人であり続けます。
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

type Goal = Database['public']['Tables']['goals']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type FlowStep = 'idle' | 'goal-select' | 'activity-select' | 'session-active' | 'reflection' | 'goal-create-input' | 'goal-create-activity' | 'goal-create-confirm';

// 目標とアクティビティの管理画面
interface GoalsManagementViewProps {
  onRefresh?: () => void;
}

function GoalsManagementView({ onRefresh }: GoalsManagementViewProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [dontDoTags, setDontDoTags] = useState<string[]>([]);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

  const { activities, loading: activitiesLoading, refetch: refetchActivities, addActivity, deleteActivity } = useActivities();
  const { addGoal: addGoalToDb, updateGoal: updateGoalInDb, deleteGoal: deleteGoalFromDb } = useGoalsDb();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [activityColor, setActivityColor] = useState("bg-sumi");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  const {
    formData: goalFormData,
    validationErrors: goalValidationErrors,
    updateField: updateGoalField,
    validateForm: validateGoalForm,
    setInitialData: setGoalFormData,
  } = useGoalForm();

  const colorOptions = [
    { value: "bg-sumi", label: "墨色", color: "#5a5a5a" },
    { value: "bg-ai", label: "藍色", color: "#165e83" },
    { value: "bg-gin-nezu", label: "銀鼠", color: "#9fa0a0" },
    { value: "bg-seiji", label: "青磁色", color: "#7ebea5" },
    { value: "bg-usuzumi", label: "薄墨色", color: "#787878" },
    { value: "bg-hatoba", label: "鳩羽色", color: "#675f7c" },
  ];

  // 目標を取得
  useEffect(() => {
    const fetchGoals = async () => {
      const result = await getActiveGoals();
      if (result.success) {
        setGoals(result.data);
      }
      setGoalsLoading(false);
    };
    fetchGoals();
  }, []);

  // 目標追加・編集
  const handleSaveGoal = async () => {
    if (!validateGoalForm()) return;

    setIsSubmittingGoal(true);
    try {
      const goalData: DbGoalFormData = {
        title: goalFormData.title,
        motivation: JSON.stringify(dontDoTags),
        deadline: goalFormData.deadline,
        weekdayHours: parseInt(goalFormData.weekdayHours),
        weekendHours: parseInt(goalFormData.weekendHours),
        calculatedHours: goalFormData.calculatedHours
      };

      const result = editingGoal
        ? await updateGoalInDb(editingGoal.id, goalData)
        : await addGoalToDb(goalData);
      
      if (result.success) {
        setShowGoalModal(false);
        setEditingGoal(null);
        setDontDoTags([]);
        setGoalFormData({});
        
        // 目標を再取得
        const refreshResult = await getActiveGoals();
        if (refreshResult.success) {
          setGoals(refreshResult.data);
        }
        onRefresh?.();
      }
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  // 目標編集
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    const parsedDontList = goal.dont_list ? JSON.parse(goal.dont_list as string) : [];
    setDontDoTags(Array.isArray(parsedDontList) ? parsedDontList : []);
    setGoalFormData({
      title: goal.title,
      deadline: goal.deadline || '',
      weekdayHours: String(goal.weekday_hours || 0),
      weekendHours: String(goal.weekend_hours || 0),
      calculatedHours: goal.target_duration || 0
    });
    setShowGoalModal(true);
  };

  // 目標削除
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('この目標を削除してもよろしいですか？')) return;
    
    const result = await deleteGoalFromDb(goalId);
    if (result.success) {
      const refreshResult = await getActiveGoals();
      if (refreshResult.success) {
        setGoals(refreshResult.data);
      }
      onRefresh?.();
    }
  };

  // アクティビティ追加
  const handleAddActivity = async () => {
    if (!activityName.trim()) return;

    setIsSubmittingActivity(true);
    try {
      const result = await addActivity({
        name: activityName.trim(),
        icon: null,
        color: activityColor,
        goal_id: null
      });

      if (result.success) {
        setShowActivityModal(false);
        setActivityName("");
        setActivityColor("bg-sumi");
        refetchActivities();
        onRefresh?.();
      }
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // アクティビティ削除
  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('このアクティビティを削除してもよろしいですか？')) return;
    
    await deleteActivity(activityId);
    refetchActivities();
    onRefresh?.();
  };

  return (
    <>
      {/* 目標追加・編集モーダル */}
      <Dialog open={showGoalModal} onOpenChange={(open) => {
        setShowGoalModal(open);
        if (!open) {
          setEditingGoal(null);
          setDontDoTags([]);
          setGoalFormData({});
        }
      }}>
        <DialogContent 
          className="bg-black/95 border border-[#4FFFB0]/30 text-white max-w-2xl backdrop-blur-xl"
          style={{ backdropFilter: "blur(20px)" }}
        >
          <DialogHeader>
            <DialogTitle className="text-[#4FFFB0] text-xl tracking-[0.2em]">
              {editingGoal ? '星座を編集' : '新しい星座を作成'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <GoalTitleInput
              value={goalFormData.title}
              onChange={(value) => updateGoalField("title", value)}
            />

            <GoalDontDoSelector
              selectedTags={dontDoTags}
              onChange={setDontDoTags}
            />

            <GoalHoursInputs
              deadline={goalFormData.deadline}
              onDeadlineChange={(value) => updateGoalField("deadline", value)}
              weekdayHours={goalFormData.weekdayHours}
              weekendHours={goalFormData.weekendHours}
              onWeekdayHoursChange={(value) => updateGoalField("weekdayHours", value)}
              onWeekendHoursChange={(value) => updateGoalField("weekendHours", value)}
              validationErrors={goalValidationErrors}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={() => {
                  setShowGoalModal(false);
                  setEditingGoal(null);
                  setDontDoTags([]);
                  setGoalFormData({});
                }}
                variant="outline"
                className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/5"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleSaveGoal}
                disabled={goalFormData.title?.trim() === "" || dontDoTags.length === 0 || isSubmittingGoal}
                className="flex-1 bg-[#4FFFB0] text-black hover:bg-[#22D3EE]"
              >
                {isSubmittingGoal ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  editingGoal ? '保存' : '作成'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* アクティビティ追加モーダル */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent 
          className="bg-black/95 border border-[#4FFFB0]/30 text-white max-w-md backdrop-blur-xl"
          style={{ backdropFilter: "blur(20px)" }}
        >
          <DialogHeader>
            <DialogTitle className="text-[#4FFFB0] text-xl tracking-[0.2em]">
              新しいアクティビティを作成
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">アクティビティ名</Label>
              <Input
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="例: 瞑想、読書、コーディング"
                className="bg-transparent border-white/20 text-white"
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">色</Label>
              <div className="grid grid-cols-6 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setActivityColor(color.value)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      activityColor === color.value 
                        ? "border-[#4FFFB0] scale-110" 
                        : "border-transparent hover:border-white/50"
                    }`}
                    style={{ backgroundColor: color.color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={() => {
                  setShowActivityModal(false);
                  setActivityName("");
                  setActivityColor("bg-sumi");
                }}
                variant="outline"
                className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/5"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleAddActivity}
                disabled={!activityName.trim() || isSubmittingActivity}
                className="flex-1 bg-[#4FFFB0] text-black hover:bg-[#22D3EE]"
              >
                {isSubmittingActivity ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  "作成"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 星座（目標）管理セクション */}
        <div>
          <h2 className="text-[#4FFFB0] text-2xl tracking-[0.3em] mb-6"
            style={{ textShadow: "0 0 30px rgba(79, 255, 176, 0.5)" }}
          >
            星座を選択
          </h2>
          
          <div className="space-y-4">
            {goalsLoading ? (
              <div className="text-center py-8">
                <div className="text-[#4FFFB0] text-xl tracking-[0.2em]">LOADING...</div>
              </div>
            ) : (
              <>
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="max-w-[576px] w-full py-4 px-6 border border-white/30 text-white text-lg tracking-[0.15em] hover:border-[#4FFFB0]/50 hover:bg-[#4FFFB0]/5 transition-all duration-300 flex items-center justify-between"
                    style={{
                      backdropFilter: "blur(8px)",
                      backgroundColor: "rgba(0, 0, 0, 0.3)"
                    }}
                  >
                    <span>{goal.title}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="p-2 text-gray-400 hover:text-[#4FFFB0] transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* 新しい星座を作成ボタン */}
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="w-full py-4 px-6 border-2 border-dashed border-[#4FFFB0]/40 text-[#4FFFB0] text-lg tracking-[0.15em] hover:border-[#4FFFB0] hover:bg-[#4FFFB0]/10 transition-all duration-300"
                  style={{
                    backdropFilter: "blur(8px)",
                    backgroundColor: "rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <Plus size={24} />
                  <span>新しい星座を作成</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* アクティビティ管理セクション */}
        <div className="pt-8 border-t border-white/10">
          <h2 className="text-[#4FFFB0] text-2xl tracking-[0.3em] mb-6"
            style={{ textShadow: "0 0 30px rgba(79, 255, 176, 0.5)" }}
          >
            何をしますか？
          </h2>
          
          <div className="space-y-4">
            {activitiesLoading ? (
              <div className="text-center py-8">
                <div className="text-[#4FFFB0] text-xl tracking-[0.2em]">LOADING...</div>
              </div>
            ) : (
              <>
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="max-w-[576px] w-full py-4 px-6 border border-white/30 text-white text-lg tracking-[0.15em] hover:border-[#4FFFB0]/50 hover:bg-[#4FFFB0]/5 transition-all duration-300 flex items-center justify-between"
                    style={{
                      backdropFilter: "blur(8px)",
                      backgroundColor: "rgba(0, 0, 0, 0.3)"
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 ${activity.color} rounded-full`} />
                      <span>{activity.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {/* 新しいアクティビティを作成ボタン */}
                <button
                  onClick={() => setShowActivityModal(true)}
                  className="w-full py-4 px-6 border-2 border-dashed border-[#4FFFB0]/40 text-[#4FFFB0] text-lg tracking-[0.15em] hover:border-[#4FFFB0] hover:bg-[#4FFFB0]/10 transition-all duration-300"
                  style={{
                    backdropFilter: "blur(8px)",
                    backgroundColor: "rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <Plus size={24} />
                  <span>新しいアクティビティを作成</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// 目標入力画面（新規作成）
interface GoalInputScreenProps {
  goalTitle: string;
  onTitleChange: (title: string) => void;
  dontDoTags: string[];
  onDontDoChange: (tags: string[]) => void;
  onNext: () => void;
  onCancel: () => void;
}

function GoalInputScreen({ 
  goalTitle, 
  onTitleChange, 
  dontDoTags, 
  onDontDoChange, 
  onNext, 
  onCancel 
}: GoalInputScreenProps) {
  const canProceed = goalTitle.trim() !== "";

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <h2 
          className="text-[#4FFFB0] text-2xl tracking-[0.3em] mb-12"
          style={{ 
            textShadow: "0 0 30px rgba(79, 255, 176, 0.5)" 
          }}
        >
          星座を作成
        </h2>
      </motion.div>

      <div className="space-y-4 max-w-xl mx-auto">
        {/* 目標タイトル入力 */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full min-w-[500px] py-4 px-6 border border-white/30 text-white text-lg tracking-[0.15em] transition-all duration-300 text-left block"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            minWidth: 0
          }}
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          <Input
            value={goalTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="例: Web開発をマスターする"
            className="w-full border-0 bg-transparent text-white text-lg tracking-[0.15em] focus:outline-none placeholder:text-gray-400 p-0"
            maxLength={50}
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        </motion.button>

        {/* 次へボタン - 常に表示 */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={onNext}
          disabled={!canProceed}
          className="w-full py-4 px-6 border border-white/30 text-white text-lg tracking-[0.15em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 block"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            minWidth: 0
          }}
        >
          次へ
        </motion.button>
      </div>
    </div>
  );
}

// 目標選択画面（選択のみ）
interface GoalSelectScreenProps {
  onSelect: (goal: Goal | null) => void;
  cachedGoals?: Goal[];
  cacheLoaded?: boolean;
}

function GoalSelectScreen({ onSelect, cachedGoals, cacheLoaded }: GoalSelectScreenProps) {
  const [goals, setGoals] = useState<Goal[]>(cachedGoals || []);
  const [loading, setLoading] = useState(!cacheLoaded);

  useEffect(() => {
    // キャッシュがある場合は使用
    if (cachedGoals && cacheLoaded) {
      setGoals(cachedGoals);
      setLoading(false);
      return;
    }

    // キャッシュがない場合のみフェッチ
    const fetchGoals = async () => {
      const result = await getActiveGoals();
      if (result.success) {
        setGoals(result.data);
      }
      setLoading(false);
    };
    fetchGoals();
  }, [cachedGoals, cacheLoaded]);

  if (loading) {
    return (
      <div className="text-center">
        <div className="text-[#4FFFB0] text-xl tracking-[0.2em]">
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <h2 
          className="text-[#4FFFB0] text-2xl tracking-[0.3em] mb-12"
          style={{ 
            textShadow: "0 0 30px rgba(79, 255, 176, 0.5)" 
          }}
        >
          星座を選択
        </h2>
      </motion.div>

      <div className="space-y-4 max-w-xl mx-auto">
        {/* 星座を選択しない */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => onSelect(null)}
          className="min-w-[500px] w-full py-4 px-6 border border-white/30 text-white text-lg tracking-[0.15em] hover:border-[#4FFFB0]/50 hover:bg-[#4FFFB0]/5 transition-all duration-300"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)"
          }}
        >
          星座を選択しない
        </motion.button>

        {/* 目標リスト */}
        {goals.map((goal, index) => (
          <motion.button
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            onClick={() => onSelect(goal)}
            className="w-full py-4 px-6 border border-white/30 text-white text-lg tracking-[0.15em] hover:border-[#4FFFB0] hover:bg-[#4FFFB0]/10 transition-all duration-300"
            style={{
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(0, 0, 0, 0.3)"
            }}
          >
            {goal.title}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// アクティビティ作成画面（新規作成）
interface ActivityCreateScreenProps {
  goalTitle: string;
  onNext: () => void;
  onCancel: () => void;
  onRefresh?: () => void;
}

function ActivityCreateScreen({ goalTitle, onNext, onCancel, onRefresh }: ActivityCreateScreenProps) {
  const { activities, loading: activitiesLoading, refetch: refetchActivities, addActivity } = useActivities();
  const [activityName, setActivityName] = useState("");
  const [activityColor, setActivityColor] = useState("bg-sumi");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorOptions = [
    { value: "bg-sumi", label: "墨色", color: "#5a5a5a" },
    { value: "bg-ai", label: "藍色", color: "#165e83" },
    { value: "bg-gin-nezu", label: "銀鼠", color: "#9fa0a0" },
    { value: "bg-seiji", label: "青磁色", color: "#7ebea5" },
    { value: "bg-usuzumi", label: "薄墨色", color: "#787878" },
    { value: "bg-hatoba", label: "鳩羽色", color: "#675f7c" },
  ];

  const handleAddActivity = async () => {
    if (!activityName.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await addActivity({
        name: activityName.trim(),
        icon: null,
        color: activityColor,
        goal_id: null
      });

      if (result.success) {
        setActivityName("");
        setActivityColor("bg-sumi");
        refetchActivities();
        onRefresh?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = activities.length > 0;

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <h2 
          className="text-[#4FFFB0] text-2xl tracking-[0.3em] mb-12"
          style={{ 
            textShadow: "0 0 30px rgba(79, 255, 176, 0.5)" 
          }}
        >
          何をしますか？
        </h2>
      </motion.div>

      <div className="space-y-6 max-w-xl mx-auto">
        {/* アクティビティ名入力 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <label className="block text-gray-300 text-sm tracking-[0.1em] text-left">
            アクティビティ名
          </label>
          <Input
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="例: 瞑想、読書、コーディング"
            className="w-full min-w-[500px] py-4 px-6 bg-transparent border border-white/20 text-white text-lg tracking-[0.1em] focus:border-[#4FFFB0] focus:outline-none transition-colors"
            style={{
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(0, 0, 0, 0.3)"
            }}
            maxLength={30}
          />
        </motion.div>

        {/* 色選択 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <label className="block text-gray-300 text-sm tracking-[0.1em] text-left">色</label>
          <div className="grid grid-cols-6 gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setActivityColor(color.value)}
                className={`w-12 h-12 rounded-full border-2 transition-all ${
                  activityColor === color.value 
                    ? "border-[#4FFFB0] scale-110" 
                    : "border-transparent hover:border-white/50"
                }`}
                style={{ backgroundColor: color.color }}
              />
            ))}
          </div>
        </motion.div>

        {/* 追加ボタン */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={handleAddActivity}
          disabled={!activityName.trim() || isSubmitting}
          className="w-full py-3 border border-white/30 text-white text-sm tracking-[0.15em] hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)"
          }}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Plus size={16} />
              <span>新しいアクティビティを追加</span>
            </>
          )}
        </motion.button>

        {/* 追加されたアクティビティ一覧 */}
        {activitiesLoading ? (
          <div className="text-center py-8">
            <div className="text-[#4FFFB0] text-sm tracking-[0.2em]">LOADING...</div>
          </div>
        ) : activities.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3 max-h-60 overflow-y-auto"
          >
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="py-3 px-6 border border-white/20 text-white text-sm tracking-[0.1em] flex items-center gap-4"
                style={{
                  backdropFilter: "blur(8px)",
                  backgroundColor: "rgba(0, 0, 0, 0.3)"
                }}
              >
                <div className={`w-3 h-3 ${activity.color} rounded-full`} />
                <span className="flex-1 text-left">{activity.name}</span>
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {/* 次へボタン */}
        {canProceed && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            onClick={onNext}
            className="w-full py-4 px-6 border border-[#4FFFB0]/60 text-white text-lg tracking-[0.2em] hover:bg-[#4FFFB0]/20 transition-all duration-300 relative overflow-hidden group"
            style={{
              boxShadow: '0 0 8px rgba(79, 255, 176, 0.15)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: "blur(8px)"
            }}
          >
            <span className="relative z-10">次へ</span>
            <div className="absolute inset-0 bg-[#4FFFB0]/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
          </motion.button>
        )}
      </div>
    </div>
  );
}

// アクティビティ選択画面（選択のみ）
interface ActivitySelectScreenProps {
  goalTitle?: string;
  onSelect: (activity: { id: string; name: string; icon: string | null; color: string } | null) => void;
}

function ActivitySelectScreen({ goalTitle, onSelect }: ActivitySelectScreenProps) {
  const { activities, loading } = useActivities();

  if (loading) {
    return (
      <div className="text-center">
        <div className="text-[#4FFFB0] text-xl tracking-[0.2em]">
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <h2 
          className="text-[#4FFFB0] text-2xl tracking-[0.3em] mb-12"
          style={{ 
            textShadow: "0 0 30px rgba(79, 255, 176, 0.5)" 
          }}
        >
          何をしますか？
        </h2>
      </motion.div>

      <div className="space-y-4 max-w-xl mx-auto">
        {/* アクティビティを選択しない */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => onSelect(null)}
          className="min-w-[500px] w-full py-4 px-6 border border-white/30 text-white text-lg tracking-[0.15em] hover:border-[#4FFFB0]/50 hover:bg-[#4FFFB0]/5 transition-all duration-300"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)"
          }}
        >
          アクティビティを選択しない
        </motion.button>

        {/* アクティビティリスト */}
        {activities.map((activity, index) => (
          <motion.button
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            onClick={() => onSelect(activity)}
            className="w-full py-4 px-6 border border-white/30 text-white text-lg tracking-[0.15em] hover:border-[#4FFFB0] hover:bg-[#4FFFB0]/10 transition-all duration-300"
            style={{
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(0, 0, 0, 0.3)"
            }}
          >
           {activity.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// 目標確認・作成画面（AI）
interface GoalConfirmScreenProps {
  goalTitle: string;
  dontDoTags: string[];
  onComplete: () => void;
  onCancel: () => void;
}

function GoalConfirmScreen({ goalTitle, dontDoTags, onComplete, onCancel }: GoalConfirmScreenProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { addGoal } = useGoalsDb();
  const [deadline, setDeadline] = useState("");
  const [weekdayHours, setWeekdayHours] = useState("1");
  const [weekendHours, setWeekendHours] = useState("1");

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const goalData: DbGoalFormData = {
        title: goalTitle,
        motivation: JSON.stringify(dontDoTags),
        deadline: deadline,
        weekdayHours: parseInt(weekdayHours) || 1,
        weekendHours: parseInt(weekendHours) || 1,
        calculatedHours: 0
      };

      const result = await addGoal(goalData);
      if (result.success) {
        onComplete();
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <h2 
          className="text-[#4FFFB0] text-2xl tracking-[0.3em] mb-12"
          style={{ 
            textShadow: "0 0 30px rgba(79, 255, 176, 0.5)" 
          }}
        >
          星座を作成
        </h2>
      </motion.div>

      <div className="space-y-6 max-w-xl mx-auto">
        {/* 目標の確認 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 border border-white/20"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)"
          }}
        >
          <div className="text-left space-y-4">
            <div>
              <label className="block text-gray-400 text-xs tracking-[0.1em] mb-2">星座名</label>
              <p className="text-white text-lg tracking-[0.1em]">{goalTitle}</p>
            </div>
            <div>
              <label className="block text-gray-400 text-xs tracking-[0.1em] mb-2">やらないこと</label>
              <div className="flex flex-wrap gap-2">
                {dontDoTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 border border-[#4FFFB0]/30 text-[#4FFFB0] text-xs tracking-[0.1em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 期限設定（オプション） */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GoalHoursInputs
            deadline={deadline}
            onDeadlineChange={setDeadline}
            weekdayHours={weekdayHours}
            weekendHours={weekendHours}
            onWeekdayHoursChange={setWeekdayHours}
            onWeekendHoursChange={setWeekendHours}
            validationErrors={{ weekdayHours: "", weekendHours: "" }}
          />
        </motion.div>

        {/* 作成ボタン */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full py-4 px-6 border border-[#4FFFB0]/60 text-white text-lg tracking-[0.2em] hover:bg-[#4FFFB0]/20 transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow: isCreating ? 'none' : '0 0 8px rgba(79, 255, 176, 0.15)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: "blur(8px)"
          }}
        >
          {isCreating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>作成中...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span className="relative z-10">星座を作成（AI）</span>
            </>
          )}
          {!isCreating && (
            <div className="absolute inset-0 bg-[#4FFFB0]/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
          )}
        </motion.button>
      </div>
    </div>
  );
}

// 振り返り画面
interface ReflectionScreenProps {
  sessionTime: string;
  onSave: (data: {
    moodScore: number;
    reflection: string;
  }) => void;
  onSkip: () => void;
}

function ReflectionScreen({ sessionTime, onSave, onSkip }: ReflectionScreenProps) {
  const [moodScore, setMoodScore] = useState<number>(3);
  const [reflection, setReflection] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    // すぐに画面を戻す
    onSave({
      moodScore,
      reflection: reflection.trim()
    });
    // 保存処理はバックグラウンドで実行される
  };

  const moodOptions = [
    { value: 1, icon: <Frown size={32} />, label: "困難", color: "#64748B" },
    { value: 2, icon: <Frown size={32} />, label: "疲労", color: "#94A3B8" },
    { value: 3, icon: <Meh size={32} />, label: "普通", color: "#A5F3FC" },
    { value: 4, icon: <Smile size={32} />, label: "良好", color: "#22D3EE" },
    { value: 5, icon: <Smile size={32} />, label: "充実", color: "#4FFFB0" },
  ];

  return (
    <div className="text-center max-w-2xl mx-auto px-6">
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-[#4FFFB0] text-3xl tracking-[0.2em] mb-8">軌跡の記録</h2>
        <div className="text-white text-5xl font-light tracking-tighter" 
          style={{ 
            textShadow: "0 0 30px rgba(79, 255, 176, 0.3)" 
          }}
        >
          {sessionTime}
        </div>
      </motion.div>

      {/* 気分の選択 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-8"
      >
        <label className="block text-[#4FFFB0] text-sm tracking-[0.2em] mb-4">
          心の状態
        </label>
        <div className="flex justify-center gap-3">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setMoodScore(option.value)}
              className="flex flex-col items-center gap-2 p-3 border transition-all duration-300 hover:scale-105"
              style={{
                borderColor: moodScore === option.value ? option.color : 'rgba(255, 255, 255, 0.2)',
                backgroundColor: moodScore === option.value ? `${option.color}20` : 'rgba(0, 0, 0, 0.3)',
                color: moodScore === option.value ? option.color : '#dbdbdb',
                backdropFilter: "blur(8px)"
              }}
            >
              {option.icon}
              <span className="text-xs tracking-[0.1em]">{option.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 振り返り */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mb-8"
      >
        <label className="block text-[#4FFFB0] text-sm tracking-[0.2em] mb-3">
          軌跡を刻む
        </label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="この時間で感じたこと、発見したこと、次への想いを記録しましょう..."
          className="w-full p-4 border border-white/20 text-white tracking-[0.05em] leading-relaxed focus:border-[#4FFFB0] focus:outline-none transition-colors duration-300 resize-none"
          rows={6}
          style={{ 
            fontSize: '14px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: "blur(8px)"
          }}
        />
        <p className="text-gray-500 text-xs tracking-[0.1em] mt-2">
          {reflection.length} 文字
        </p>
      </motion.div>

      {/* ボタン */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex gap-4"
      >
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="flex-1 py-3 border border-white/30 text-white tracking-[0.2em] hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            fontSize: '14px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: "blur(8px)"
          }}
        >
          スキップ
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex-1 py-3 border border-[#4FFFB0]/60 text-white tracking-[0.2em] hover:bg-[#4FFFB0]/20 transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            fontSize: '14px',
            boxShadow: isLoading ? 'none' : '0 0 8px rgba(79, 255, 176, 0.15)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: "blur(8px)"
          }}
        >
          <span className="relative z-10">
            {isLoading ? '記録中...' : '記録を刻む'}
          </span>
          {!isLoading && (
            <div className="absolute inset-0 bg-[#4FFFB0]/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
          )}
        </button>
      </motion.div>
    </div>
  );
}

function Footer() {
    return (
        <footer className="fixed bottom-0 left-0 w-full p-8 z-10 flex justify-center items-end pointer-events-none">
             <div style={{ color: '#dbdbdb', fontSize: '10px', letterSpacing: '0.2em' }}>
                 CO-EXIST
             </div>
        </footer>
    )
}

export function HorizonPage() {
  // Sessions Context
  const { 
    currentSession,
    isSessionActive,
    formattedTime,
    startSession,
    endSession,
    saveSession
  } = useSessions();

  // Activities Context
  const { refetch: refetchActivities } = useActivities();

  // Flow管理
  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  
  // Goals作成用のデータ
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDontDo, setNewGoalDontDo] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  const [sessionMemories, setSessionMemories] = useState<SessionMemory[]>([]);
  const [hoveredMemory, setHoveredMemory] = useState<SessionMemory | null>(null);
  const [showMessenger, setShowMessenger] = useState(false);
  const [completedSessionTime, setCompletedSessionTime] = useState("00:00");

  // 目標とアクティビティのキャッシュ
  const [goalsCache, setGoalsCache] = useState<Goal[]>([]);
  const [goalsCacheLoaded, setGoalsCacheLoaded] = useState(false);

  // キャッシュを更新する関数
  const refreshCache = async () => {
    console.log('Refreshing cache...');
    // 目標を再取得
    const goalsResult = await getActiveGoals();
    if (goalsResult.success) {
      setGoalsCache(goalsResult.data);
      console.log('Goals cache updated:', goalsResult.data.length, 'goals');
    }
    // アクティビティを再取得
    await refetchActivities();
    console.log('Activities cache updated');
  };

  // グローバルイベントリスナーでキャッシュ更新を受け取る
  useEffect(() => {
    const handleCacheRefresh = () => {
      refreshCache();
    };

    // カスタムイベントをリッスン
    window.addEventListener('refresh-horizon-cache', handleCacheRefresh);

    return () => {
      window.removeEventListener('refresh-horizon-cache', handleCacheRefresh);
    };
  }, []);

  // 初期ロード時に目標を取得してキャッシュ
  useEffect(() => {
    const loadGoals = async () => {
      const result = await getActiveGoals();
      if (result.success) {
        setGoalsCache(result.data);
      }
      setGoalsCacheLoaded(true);
    };
    loadGoals();
  }, []);

  // 初期のセッションメモリーをモック
  useEffect(() => {
    const mockMemories: SessionMemory[] = [
      {
        id: '1',
        angle: Math.PI * 0.2,
        radius: 4.5,
        time: '14:30',
        memory: '集中の波紋が広がった瞬間',
        color: '#4FFFB0'
      },
      {
        id: '2',
        angle: Math.PI * 0.6,
        radius: 4.5,
        time: '16:15',
        memory: '静寂の中で思考が深まる',
        color: '#22D3EE'
      },
      {
        id: '3',
        angle: Math.PI * 1.2,
        radius: 4.5,
        time: '19:00',
        memory: '新たな発見の光',
        color: '#A5F3FC'
      },
    ];
    setSessionMemories(mockMemories);
  }, []);

  // セッションがアクティブになったらflowStepを更新
  // ただし、idleに戻った後は自動遷移しない
  useEffect(() => {
    if (isSessionActive && flowStep !== 'session-active' && flowStep !== 'reflection' && flowStep !== 'idle') {
      setFlowStep('session-active');
    }
  }, [isSessionActive, flowStep]);

  const handleStartClick = () => {
    // START → 目標選択画面へ
    setFlowStep('goal-select');
  };

  const handleGoalSelect = (goal: Goal | null) => {
    setSelectedGoal(goal);
    // 目標選択 → アクティビティ選択画面へ
    setFlowStep('activity-select');
  };

  const handleActivitySelect = async (activity: { id: string; name: string; icon: string | null; color: string } | null) => {
    if (!activity) {
      // アクティビティを選択しない場合は、開始画面に戻る
      console.log('No activity selected, returning to idle');
      setFlowStep('idle');
      return;
    }
    
    console.log('Activity selected:', activity.name);
    
    // まず画面遷移
    setFlowStep('session-active');
    
    // アニメーションが完了してからセッションを開始（1.2秒後）
    setTimeout(async () => {
      await startSession({
        activityId: activity.id,
        activityName: activity.name,
        startTime: new Date(),
        location: "",
        notes: "",
        activityColor: activity.color || "#4FFFB0",
        activityIcon: activity.icon || undefined,
        goalId: selectedGoal?.id,
      });
      console.log('Session started after animation');
    }, 1200);
  };

  const handleEndSession = () => {
    console.log('END SESSION clicked');
    console.log('Current flowStep:', flowStep);
    console.log('isSessionActive:', isSessionActive);
    
    // セッション時間を保存
    setCompletedSessionTime(formattedTime);
    
    // セッションを終了状態にする
    endSession();
    
    // 振り返り画面へ遷移
    setFlowStep('reflection');
    console.log('FlowStep set to reflection');
  };

  const handleReflectionSave = async (data: {
    moodScore: number;
    reflection: string;
  }) => {
    if (!currentSession) return;

    // すぐにidle状態に戻る（UIを即座に更新）
    setFlowStep('idle');
    setSelectedGoal(null);

    // 新しいセッションメモリーを追加
    const newMemory: SessionMemory = {
      id: Date.now().toString(),
      angle: Math.random() * Math.PI * 2,
      radius: 4.5,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      memory: data.reflection || '光の残滓が軌道に刻まれた',
      color: ['#4FFFB0', '#22D3EE', '#A5F3FC'][Math.floor(Math.random() * 3)]
    };
    setSessionMemories(prev => [...prev, newMemory]);

    // バックグラウンドでセッションをデータベースに保存
    const completedSession: CompletedSession = {
      id: "", // saveSessionで設定される
      activityId: currentSession.activityId,
      activityName: currentSession.activityName,
      startTime: currentSession.startTime,
      endTime: new Date(),
      duration: Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000),
      location: currentSession.location || "",
      notes: data.reflection,
      activityColor: currentSession.activityColor,
      activityIcon: currentSession.activityIcon,
      goalId: selectedGoal?.id,
      mood: data.moodScore,
    };

    // 非同期でバックグラウンド保存
    saveSession(completedSession).catch((error) => {
      console.error('セッション保存エラー:', error);
    });
  };

  const handleReflectionSkip = async () => {
    if (!currentSession) return;

    // すぐにidle状態に戻る（UIを即座に更新）
    setFlowStep('idle');
    setSelectedGoal(null);

    // バックグラウンドでセッションを保存（振り返りなし）
    const completedSession: CompletedSession = {
      id: "",
      activityId: currentSession.activityId,
      activityName: currentSession.activityName,
      startTime: currentSession.startTime,
      endTime: new Date(),
      duration: Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000),
      location: currentSession.location || "",
      notes: "",
      activityColor: currentSession.activityColor,
      activityIcon: currentSession.activityIcon,
      goalId: selectedGoal?.id,
    };

    // 非同期でバックグラウンド保存
    saveSession(completedSession).catch((error) => {
      console.error('セッション保存エラー:', error);
    });
  };

  const handleMemoryHover = (memory: SessionMemory | null) => {
    setHoveredMemory(memory);
  };

  const handleGoalsClick = () => {
    // 目標作成フローを開始
    setFlowStep('goal-create-input');
    setNewGoalTitle("");
    setNewGoalDontDo([]);
  };

  const handleGoalInputNext = () => {
    // アクティビティ作成画面へ
    setFlowStep('goal-create-activity');
  };

  const handleActivityCreateNext = () => {
    // 確認画面へ
    setFlowStep('goal-create-confirm');
  };

  const handleGoalCreateComplete = () => {
    // 目標作成完了 → idle画面に戻る
    setFlowStep('idle');
    setNewGoalTitle("");
    setNewGoalDontDo([]);
    refreshCache();
  };

  const handleGoalCreateCancel = () => {
    // キャンセル → idle画面に戻る
    setFlowStep('idle');
    setNewGoalTitle("");
    setNewGoalDontDo([]);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: '#000000' }}>
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
          <SceneContent 
            sessionMemories={sessionMemories}
            onMemoryHover={handleMemoryHover}
          />
        </Canvas>
      </div>

      {/* Moon Effects Overlay - ビネット効果 */}
      <div 
        className="absolute inset-0 z-5 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(0, 0, 0, 0.3) 20%, rgba(0, 0, 0, 0.5) 40%, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0.8) 80%)",
        }}
      />
      
      {/* Moon Effects Overlay - ノイズテクスチャ */}
      <div 
        className="absolute inset-0 z-5 pointer-events-none opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
        style={{
          mixBlendMode: 'overlay',
          maskImage: 'radial-gradient(circle at center, black 45%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 45%, transparent 70%)'
        }}
      />

      {/* Memory Hover Tooltip */}
      <AnimatePresence>
        {hoveredMemory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="relative">
              {/* 波紋エフェクト */}
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: '#4FFFB0' }}
                animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid #4FFFB0', padding: '16px 24px' }}>
                <div style={{ color: '#dbdbdb', fontSize: '12px', letterSpacing: '0.2em', marginBottom: '4px' }}>
                  {hoveredMemory.time}
                </div>
                <div style={{ color: '#dbdbdb', fontSize: '14px', letterSpacing: '0.05em' }}>
                  {hoveredMemory.memory}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messenger Modal Overlay - 月を暗くする */}
      <AnimatePresence>
        {showMessenger && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <MessengerModal onClose={() => setShowMessenger(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Layers */}
      <Header isHidden={flowStep !== 'idle'} />
      <Sidebar 
        isHidden={flowStep !== 'idle'} 
        onMessengerClick={() => setShowMessenger(true)}
        onGoalsClick={handleGoalsClick}
      />
      <CenterOverlay 
        step={flowStep}
        onStartClick={handleStartClick}
        onGoalSelect={handleGoalSelect}
        onActivitySelect={handleActivitySelect}
        onReflectionSave={handleReflectionSave}
        onReflectionSkip={handleReflectionSkip}
        onEndSession={handleEndSession}
        sessionTime={flowStep === 'reflection' ? completedSessionTime : formattedTime}
        selectedGoalTitle={selectedGoal?.title}
        goalsCache={goalsCache}
        goalsCacheLoaded={goalsCacheLoaded}
        newGoalTitle={newGoalTitle}
        onNewGoalTitleChange={setNewGoalTitle}
        newGoalDontDo={newGoalDontDo}
        onNewGoalDontDoChange={setNewGoalDontDo}
        onGoalInputNext={handleGoalInputNext}
        onActivityCreateNext={handleActivityCreateNext}
        onGoalCreateComplete={handleGoalCreateComplete}
        onGoalCreateCancel={handleGoalCreateCancel}
        onRefreshCache={refreshCache}
      />
      <RightConstellation />
      <Footer />
    </div>
  );
}

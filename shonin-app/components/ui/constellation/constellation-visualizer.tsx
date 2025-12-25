"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ConstellationNode {
  id: number;
  x: number;
  y: number;
  label?: string;
}

interface ConstellationEdge {
  from: number;
  to: number;
}

interface ConstellationData {
  symbolName: string;
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  message: string;
}

interface ConstellationVisualizerProps {
  goal: string;
  deadline?: string;
  targetPosition?: { x: number; y: number } | null;
  onAdd?: (constellation: ConstellationData) => void;
  onCancel?: () => void;
}

export function ConstellationVisualizer({ goal, deadline, targetPosition, onAdd, onCancel }: ConstellationVisualizerProps) {
  const [constellation, setConstellation] = useState<ConstellationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleEdges, setVisibleEdges] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateConstellation();
  }, [goal, deadline]);

  // 線を一本ずつアニメーション
  useEffect(() => {
    if (!constellation || visibleEdges >= constellation.edges.length || isAnimating) {
      return;
    }

    const timer = setTimeout(() => {
      setVisibleEdges(prev => prev + 1);
    }, 300); // 300msごとに1本ずつ線を描画

    return () => clearTimeout(timer);
  }, [visibleEdges, constellation, isAnimating]);

  const generateConstellation = async () => {
    setLoading(true);
    setError(null);
    setVisibleEdges(0);

    try {
      const response = await fetch('/api/ai/generate-constellation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal, deadline }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '星座の生成に失敗しました');
      }

      setConstellation(result.data);
    } catch (err) {
      console.error('Constellation generation error:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (constellation && onAdd) {
      setIsAnimating(true);
      onAdd(constellation);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[#4FFFB0] text-xl tracking-[0.2em]"
        >
          星座を生成中...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        <button
          onClick={generateConstellation}
          className="px-6 py-2 border border-[#4FFFB0] text-[#4FFFB0] hover:bg-[#4FFFB0]/10 transition-all"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!constellation) {
    return null;
  }

  // Canvasのサイズを計算（padding考慮）
  const canvasWidth = 600;
  const canvasHeight = 600;
  const padding = 100;

  const isComplete = visibleEdges >= constellation.edges.length;
  
  // 作成中は白、完成後は金色
  const lineColor = isComplete ? "#fbbf24" : "#ffffff";
  const starColor = isComplete ? "#fbbf24" : "#ffffff";

  // 3D座標をスクリーン座標に変換
  // targetPosition は 3D空間での座標 (x: -7〜7, y: -5〜5くらい)
  // スクリーン座標は画面中央を0,0とする
  const calculateScreenPosition = () => {
    if (!targetPosition) {
      // デフォルトは右上
      return {
        x: window.innerWidth * 0.3,
        y: -window.innerHeight * 0.2
      };
    }

    // 3D空間の座標をスクリーン座標に変換
    // カメラは (0, 0, 12) の位置から見ている
    // FOV 45度を考慮した投影
    const fov = 45;
    const aspect = window.innerWidth / window.innerHeight;
    const distance = 12; // カメラのZ位置
    
    // 簡易的な投影計算
    const scale = window.innerHeight / (2 * Math.tan((fov * Math.PI) / 360));
    const screenX = (targetPosition.x / distance) * scale;
    const screenY = -(targetPosition.y / distance) * scale; // Y軸反転
    
    return {
      x: screenX,
      y: screenY
    };
  };

  const screenPosition = calculateScreenPosition();

  return (
    <motion.div 
      className="text-center"
      animate={isAnimating ? {
        scale: 0.2,
        x: screenPosition.x,
        y: screenPosition.y,
        opacity: 0
      } : {}}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {/* 星座名 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mb-8"
      >
        <h2 
          className="text-[#4FFFB0] text-3xl tracking-[0.3em] mb-4"
          style={{ 
            textShadow: "0 0 30px rgba(79, 255, 176, 0.5)" 
          }}
        >
          {constellation.symbolName}
        </h2>
        <p className="text-gray-300 text-sm tracking-[0.1em] max-w-md mx-auto">
          {constellation.message}
        </p>
      </motion.div>

      {/* 星座の描画 */}
      <div 
        ref={canvasRef}
        className="relative mx-auto mb-8"
        style={{ 
          width: canvasWidth, 
          height: canvasHeight,
          maxWidth: '100%'
        }}
      >
        {/* SVGで線を描画 */}
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="absolute inset-0"
          style={{ backgroundColor: 'transparent' }}
        >
          {constellation.edges.slice(0, visibleEdges).map((edge, index) => {
            const fromNode = constellation.nodes.find(n => n.id === edge.from);
            const toNode = constellation.nodes.find(n => n.id === edge.to);
            
            if (!fromNode || !toNode) return null;

            const x1 = fromNode.x * (canvasWidth - padding * 2) + padding;
            const y1 = fromNode.y * (canvasHeight - padding * 2) + padding;
            const x2 = toNode.x * (canvasWidth - padding * 2) + padding;
            const y2 = toNode.y * (canvasHeight - padding * 2) + padding;

            return (
              <motion.line
                key={`edge-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={lineColor}
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{
                  filter: isComplete 
                    ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' 
                    : 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))'
                }}
              />
            );
          })}
        </svg>

        {/* 星（ノード）を描画 */}
        {constellation.nodes.map((node, index) => {
          const x = node.x * (canvasWidth - padding * 2) + padding;
          const y = node.y * (canvasHeight - padding * 2) + padding;

          return (
            <motion.div
              key={`node-${node.id}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: 0.1 + index * 0.1,
                duration: 0.5,
                type: "spring"
              }}
              className="absolute"
              style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <motion.div
                className="w-3 h-3 rounded-full"
                animate={{ 
                  backgroundColor: isComplete ? "#fbbf24" : "#ffffff"
                }}
                transition={{ duration: 0.5 }}
                style={{
                  boxShadow: isComplete 
                    ? '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)'
                    : '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3)',
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* 追加ボタン */}
      {isComplete && !isAnimating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 justify-center"
        >
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-8 py-3 border border-white/30 text-white text-lg tracking-[0.2em] hover:bg-white/10 transition-all duration-300"
              style={{
                backdropFilter: "blur(8px)",
                backgroundColor: "rgba(0, 0, 0, 0.3)"
              }}
            >
              キャンセル
            </button>
          )}
          <button
            onClick={handleAdd}
            className="px-12 py-3 border border-[#4FFFB0]/60 text-white text-lg tracking-[0.2em] hover:bg-[#4FFFB0]/20 transition-all duration-300 relative overflow-hidden group"
            style={{
              boxShadow: '0 0 8px rgba(79, 255, 176, 0.15)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: "blur(8px)"
            }}
          >
            <span className="relative z-10">追加</span>
            <div className="absolute inset-0 bg-[#4FFFB0]/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}


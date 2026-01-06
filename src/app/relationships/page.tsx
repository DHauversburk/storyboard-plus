"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';

// --- Types (Mirrors CharactersPage) ---
interface Character {
    id: string;
    name: string;
    role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
    relationships: { characterId: string; relationship: string }[];
    description: string;
    imageUrl?: string;
}

interface Node extends Character {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
}

interface Edge {
    source: Node;
    target: Node;
    label: string;
}

const ROLE_COLORS_HEX = {
    protagonist: '#10b981', // Emerald 500
    antagonist: '#ef4444', // Red 500
    supporting: '#3b82f6', // Blue 500
    minor: '#6b7280'       // Gray 500
};

export default function RelationshipsPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // Simulation Refs
    const nodesRef = useRef<Node[]>([]);
    const edgesRef = useRef<Edge[]>([]);
    const animationRef = useRef<number | null>(null);
    const draggingNode = useRef<Node | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    // Load Data
    useEffect(() => {
        const saved = localStorage.getItem('sb_characters');
        if (saved) {
            try {
                const loaded: Character[] = JSON.parse(saved);
                setCharacters(loaded);
                initializeGraph(loaded);
            } catch (e) {
                console.error("Failed to load characters", e);
            }
        }
    }, []);

    // Initialize Graph Simulation Data
    const initializeGraph = (chars: Character[]) => {
        const width = wrapperRef.current?.offsetWidth || 800;
        const height = wrapperRef.current?.offsetHeight || 600;

        // Create Nodes
        const newNodes: Node[] = chars.map((c, i) => ({
            ...c,
            x: Math.random() * width * 0.6 + width * 0.2, // Center-ish
            y: Math.random() * height * 0.6 + height * 0.2,
            vx: 0,
            vy: 0,
            radius: c.role === 'protagonist' || c.role === 'antagonist' ? 30 : 20,
            color: ROLE_COLORS_HEX[c.role] || '#9ca3af'
        }));

        // Create Edges
        const newEdges: Edge[] = [];
        chars.forEach(sourceChar => {
            const sourceNode = newNodes.find(n => n.id === sourceChar.id);
            if (!sourceNode) return;

            sourceChar.relationships.forEach(rel => {
                const targetNode = newNodes.find(n => n.id === rel.characterId);
                // Avoid duplicates (if A->B exists, don't double count unless directed?)
                // For layout, we want links. 
                if (targetNode) {
                    // Check if reverse edge exists to avoid double drawing lines? 
                    // Let's allow directed edges logic, but for physics, just one link is fine.
                    newEdges.push({
                        source: sourceNode,
                        target: targetNode,
                        label: rel.relationship
                    });
                }
            });
        });

        nodesRef.current = newNodes;
        edgesRef.current = newEdges;

        if (!animationRef.current) {
            startSimulation();
        }
    };

    // Physics Loop
    const startSimulation = () => {
        const tick = () => {
            updatePhysics();
            draw();
            animationRef.current = requestAnimationFrame(tick);
        };
        tick();
    };

    const updatePhysics = () => {
        const nodes = nodesRef.current;
        const edges = edgesRef.current;
        const width = canvasRef.current?.width || 800;
        const height = canvasRef.current?.height || 600;

        // Constants
        const k = 0.5; // Repulsion constant
        const damping = 0.9;
        const centerParams = { x: width / 2, y: height / 2, strength: 0.02 };

        // 1. Repulsion (Msg between all pairs)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist === 0) dist = 0.1; // Prevent div by zero

                const minDist = nodes[i].radius + nodes[j].radius + 50;
                if (dist < minDist) {
                    const force = (minDist - dist) * k;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;

                    nodes[i].vx += fx;
                    nodes[i].vy += fy;
                    nodes[j].vx -= fx;
                    nodes[j].vy -= fy;
                }
            }
        }

        // 2. Attraction (Edges)
        edges.forEach(edge => {
            const dx = edge.target.x - edge.source.x;
            const dy = edge.target.y - edge.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Spring force
            const strength = 0.005;
            const idealLength = 200;

            const force = (dist - idealLength) * strength;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            edge.source.vx += fx;
            edge.source.vy += fy;
            edge.target.vx -= fx;
            edge.target.vy -= fy;
        });

        // 3. Center Gravity & Move
        nodes.forEach(node => {
            // Mouse Drag
            if (node === draggingNode.current) {
                node.x = mousePos.current.x;
                node.y = mousePos.current.y;
                node.vx = 0;
                node.vy = 0;
                return;
            }

            // Gravity
            node.vx += (centerParams.x - node.x) * centerParams.strength;
            node.vy += (centerParams.y - node.y) * centerParams.strength;

            // Update Position
            node.vx *= damping;
            node.vy *= damping;
            node.x += node.vx;
            node.y += node.vy;

            // Bounds
            const padding = node.radius;
            if (node.x < padding) node.x = padding;
            if (node.x > width - padding) node.x = width - padding;
            if (node.y < padding) node.y = padding;
            if (node.y > height - padding) node.y = height - padding;
        });
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Edges
        ctx.strokeStyle = '#ffffff33';
        ctx.lineWidth = 1;
        edgesRef.current.forEach(edge => {
            ctx.beginPath();
            ctx.moveTo(edge.source.x, edge.source.y);
            ctx.lineTo(edge.target.x, edge.target.y);
            ctx.stroke();

            // Label
            const midX = (edge.source.x + edge.target.x) / 2;
            const midY = (edge.source.y + edge.target.y) / 2;
            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(edge.label, midX, midY - 5);
        });

        // Nodes
        nodesRef.current.forEach(node => {
            // Glow
            const gradient = ctx.createRadialGradient(node.x, node.y, node.radius * 0.2, node.x, node.y, node.radius * 1.5);
            gradient.addColorStop(0, node.color);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#1e1e1e';
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();

            // Ring
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Icon/Text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Initials
            const initials = node.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            ctx.fillText(initials, node.x, node.y);

            // Label below
            ctx.fillStyle = '#e5e7eb'; // Gray 200
            ctx.font = '12px sans-serif';
            ctx.fillText(node.name, node.x, node.y + node.radius + 15);
        });
    };

    // Interaction Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find clicked node
        const clicked = nodesRef.current.find(n => {
            const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2);
            return dist < n.radius;
        });

        if (clicked) {
            draggingNode.current = clicked;
            mousePos.current = { x, y };
            setSelectedNode(clicked);
        } else {
            setSelectedNode(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingNode.current && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            mousePos.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    const handleMouseUp = () => {
        draggingNode.current = null;
    };

    const resizeCanvas = () => {
        if (wrapperRef.current && canvasRef.current) {
            canvasRef.current.width = wrapperRef.current.offsetWidth;
            canvasRef.current.height = wrapperRef.current.offsetHeight;
        }
    };

    useEffect(() => {
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <div className="h-screen relative overflow-hidden bg-[#0d0f12] text-gray-200">
            {/* Main Canvas Area */}
            <div ref={wrapperRef} className="absolute inset-0 cursor-crosshair z-0">
                <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Relationship Web
                    </h1>
                    <p className="text-white/50 text-sm">Drag nodes to rearrange. Click to view details.</p>
                </div>

                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="block outline-none w-full h-full"
                />
            </div>

            {/* Sidebar Details (Mobile: Bottom Sheet, Desktop: Right Sidebar) */}
            {selectedNode && (
                <div className="
                    absolute z-20 shadow-2xl bg-gray-900/80 backdrop-blur-md border-white/10
                    lg:right-0 lg:top-0 lg:bottom-0 lg:w-80 lg:border-l
                    left-0 right-0 bottom-0 h-[60%] border-t lg:h-auto lg:left-auto lg:border-t-0
                    p-6 flex flex-col gap-6 overflow-y-auto transition-transform animate-in slide-in-from-bottom lg:slide-in-from-right duration-300
                ">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: selectedNode.color, color: selectedNode.color }} />
                                <span className="text-xs uppercase tracking-wide text-gray-400">{selectedNode.role}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight">{selectedNode.name}</h2>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="p-2 -mr-2 -mt-2 text-gray-500 hover:text-white bg-white/5 rounded-full"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Relationships</h3>
                            {selectedNode.relationships.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No connections yet.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {selectedNode.relationships.map((rel, i) => {
                                        const other = nodesRef.current.find(n => n.id === rel.characterId);
                                        return (
                                            <li key={i} className="text-sm flex justify-between items-center bg-black/20 p-2 rounded">
                                                <span className="text-gray-300 font-medium">{other?.name || 'Unknown'}</span>
                                                <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{rel.relationship}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Description</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {selectedNode.description || "No description."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Spread } from "@/types/comic";

interface ComicCanvasProps {
    grid: "grid-1" | "grid-2" | "grid-4" | "grid-3a" | "grid-3b" | "grid-4s";
    spread: Spread | null;
    isGenerating: boolean;
    selectedPanel: number | null;
    onSelectPanel: (index: number | null) => void;
}

export default function ComicCanvas({ grid, spread, isGenerating, selectedPanel, onSelectPanel }: ComicCanvasProps) {
    // Generate placeholder panels based on grid selection
    const getPlaceholders = () => {
        switch (grid) {
            case "grid-1": return [1];
            case "grid-2": return [1, 2];
            case "grid-3a":
            case "grid-3b": return [1, 2, 3];
            case "grid-4":
            case "grid-4s": return [1, 2, 3, 4];
            default: return [1];
        }
    };

    const panels = spread ? (spread.rightPanels.length > 0 ? spread.rightPanels : spread.leftPanels) : [];
    const placeholders = getPlaceholders();

    // Determine grid class
    const getGridClass = () => {
        return `canvas-${grid}`;
    };

    return (
        <div className="comic-canvas-container">
            <div className={`comic-canvas ${getGridClass()}`} style={{ width: "100%", height: "100%" }}>
                <AnimatePresence mode="popLayout">
                    {spread ? (
                        // Render generated panels
                        panels.map((panel, index) => (
                            <motion.div
                                key={`panel-${index}`}
                                className={`canvas-panel filled${selectedPanel === index ? " selected" : ""}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => onSelectPanel(selectedPanel === index ? null : index)}
                            >
                                <img src={panel.src} alt={`Panel ${index + 1}`} />
                                {panel.narration && (
                                    <div className="canvas-narration">{panel.narration}</div>
                                )}
                                {panel.caption && (
                                    <div className="canvas-caption">{panel.caption}</div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        // Render placeholders
                        placeholders.map((i) => (
                            <motion.div
                                key={`placeholder-${i}`}
                                className="canvas-panel empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="placeholder-content">
                                    {isGenerating ? (
                                        <div className="loading-spinner"></div>
                                    ) : (
                                        <span>{i}</span>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

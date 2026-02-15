"use client";

import React from "react";
import { motion } from "framer-motion";

interface SidebarProps {
    story: string;
    setStory: (story: string) => void;
    style: string;
    setStyle: (style: string) => void;
    grid: "grid-0" | "grid-1" | "grid-2" | "grid-3";
    setGrid: (grid: "grid-0" | "grid-1" | "grid-2" | "grid-3") => void;
    captions: boolean;
    setCaptions: (captions: boolean) => void;
    bubbles: boolean;
    setBubbles: (bubbles: boolean) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    selectedPanel: number | null;
    onDeselectPanel: () => void;
    error?: string | null;
}

export default function Sidebar({
    story,
    setStory,
    style,
    setStyle,
    grid,
    setGrid,
    captions,
    setCaptions,
    bubbles,
    setBubbles,
    onGenerate,
    isGenerating,
    selectedPanel,
    onDeselectPanel,
    error,
}: SidebarProps) {
    return (
        <div className="sidebar">
            <div className="chat-interface-container">
                {error && (
                    <div style={{
                        padding: '10px',
                        marginBottom: '10px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #ef4444',
                        borderRadius: '0.375rem',
                        color: '#b91c1c',
                        fontSize: '0.875rem'
                    }}>
                        ⚠️ {error}
                    </div>
                )}
                {/* Panel indicator */}
                {selectedPanel !== null && (
                    <motion.div
                        className="panel-indicator"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                    >
                        <span>🎯 Panel {selectedPanel + 1}</span>
                        <button
                            className="panel-indicator-dismiss"
                            onClick={onDeselectPanel}
                            title="Deselect panel"
                        >
                            ×
                        </button>
                    </motion.div>
                )}

                {/* Top: Text Input */}
                <textarea
                    className="chat-input-area"
                    placeholder="Describe your story here..."
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (story.trim() && !isGenerating) onGenerate();
                        }
                    }}
                />

                {/* Bottom: Options & Actions */}
                <div className="chat-controls-row">
                    <div className="chat-options-group">
                        <select
                            className="chat-sub-select"
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            title="Visual Style"
                        >
                            <option value="">No Style (Default)</option>
                            <option value="Japanese">Japanese (Manga)</option>
                            <option value="Nihonga">Nihonga</option>
                            <option value="Franco-Belgian">Franco-Belgian</option>
                            <option value="American (modern)">American (Modern)</option>
                            <option value="American (1950)">American (1950)</option>
                            <option value="Flying saucer">Flying Saucer</option>
                            <option value="Humanoid">Humanoid</option>
                            <option value="Haddock">Haddock</option>
                            <option value="Armorican">Armorican</option>
                            <option value="3D Render">3D Render</option>
                            <option value="Klimt">Klimt</option>
                            <option value="Medieval">Medieval</option>
                            <option value="Egyptian">Egyptian</option>
                        </select>

                        <select
                            className="chat-sub-select"
                            value={grid}
                            onChange={(e) => setGrid(e.target.value as any)}
                            title="Panel Layout"
                        >
                            <option value="grid-0">Grid 0</option>
                            <option value="grid-1">Grid 1 ▐▌</option>
                            <option value="grid-2">Grid 2 ▐▌▄</option>
                            <option value="grid-3">Grid 3 ▞▞</option>
                        </select>

                        <label className="chat-pill-toggle">
                            <input
                                type="checkbox"
                                checked={captions}
                                onChange={(e) => setCaptions(e.target.checked)}
                            />
                            <span>Captions</span>
                        </label>
                        <label className="chat-pill-toggle">
                            <input
                                type="checkbox"
                                checked={bubbles}
                                onChange={(e) => setBubbles(e.target.checked)}
                            />
                            <span>Bubbles</span>
                        </label>
                    </div>

                    <motion.button
                        className="chat-submit-btn"
                        onClick={onGenerate}
                        disabled={isGenerating || !story.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Forge Comic"
                    >
                        {isGenerating ? (
                            <div className="loading-dots">...</div>
                        ) : (
                            <svg className="forge-arrow-icon" viewBox="0 0 24 24">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

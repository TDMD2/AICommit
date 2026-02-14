"use client";

import React from "react";
import { motion } from "framer-motion";

interface SidebarProps {
    story: string;
    setStory: (story: string) => void;
    style: string;
    setStyle: (style: string) => void;
    grid: "grid-1" | "grid-2" | "grid-4" | "grid-3a" | "grid-3b" | "grid-4s";
    setGrid: (grid: "grid-1" | "grid-2" | "grid-4" | "grid-3a" | "grid-3b" | "grid-4s") => void;
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
                        <input
                            type="text"
                            className="chat-sub-input"
                            placeholder="Style (e.g. Manga)"
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            title="Visual Style"
                        />

                        <select
                            className="chat-sub-select"
                            value={grid}
                            onChange={(e) => setGrid(e.target.value as any)}
                            title="Panel Layout"
                        >
                            <option value="grid-1">Single Panel</option>
                            <option value="grid-2">Dual Split</option>
                            <option value="grid-3a">Triple (Top)</option>
                            <option value="grid-3b">Triple (Low)</option>
                            <option value="grid-4">Quad Grid</option>
                            <option value="grid-4s">Quad Asym</option>
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

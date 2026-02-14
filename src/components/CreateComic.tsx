"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface CreateComicProps {
    onGenerate: (description: string) => void;
    isLoading: boolean;
    format: "comic" | "slide";
    setFormat: (format: "comic" | "slide") => void;
}

export default function CreateComic({ onGenerate, isLoading, ...props }: CreateComicProps) {
    const [description, setDescription] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim() && !isLoading) {
            onGenerate(description.trim());
        }
    };

    return (
        <div className="create-comic-container">
            {/* Background halftone pattern */}
            <div className="halftone-bg" />

            {/* Floating comic elements */}
            <div className="floating-elements">
                <motion.div
                    className="float-pow"
                    animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    POW!
                </motion.div>
                <motion.div
                    className="float-zap"
                    animate={{ y: [0, 10, 0], rotate: [0, -3, 3, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                    ZAP!
                </motion.div>
                <motion.div
                    className="float-boom"
                    animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                    BOOM!
                </motion.div>
            </div>

            {/* Main content */}
            <motion.div
                className="create-comic-content"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                {/* Title */}
                <motion.div
                    className="hero-title"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 150 }}
                >
                    <div className="title-burst">
                        <span className="title-main">CREATE YOUR</span>
                        <span className="title-comic">COMIC</span>
                    </div>
                </motion.div>

                <motion.p
                    className="hero-subtitle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    Describe your story and watch it come to life as a comic book!
                </motion.p>

                {/* Format Selection */}
                <div className="format-selection">
                    <label className="format-label">Select Format:</label>
                    <div className="format-options">
                        <button
                            type="button"
                            className={`format-option ${props.format === "comic" ? "active" : ""}`}
                            onClick={() => props.setFormat("comic")}
                        >
                            <span className="format-icon">📖</span>
                            Comic Page
                        </button>
                        <button
                            type="button"
                            className={`format-option ${props.format === "slide" ? "active" : ""}`}
                            onClick={() => props.setFormat("slide")}
                        >
                            <span className="format-icon">🖼️</span>
                            Single Slide
                        </button>
                    </div>
                </div>

                {/* Form */}
                <motion.form
                    className="story-form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                >
                    <div className="textarea-wrapper">
                        <textarea
                            className="story-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={props.format === "comic"
                                ? 'e.g. "Captain America punching a giant octopus on the beach while seagulls fly overhead"'
                                : 'e.g. "A cinematic shot of a futuristic city with flying cars at sunset"'
                            }
                            rows={4}
                            maxLength={500}
                            disabled={isLoading}
                        />
                        <div className="char-count">
                            {description.length}/500
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        className="generate-btn"
                        disabled={!description.trim() || isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="btn-burst" />
                        <span className="btn-text">
                            {isLoading ? "GENERATING..." : "⚡ GENERATE! ⚡"}
                        </span>
                    </motion.button>
                </motion.form>

                {/* Example prompts */}
                <motion.div
                    className="example-prompts"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                >
                    <p className="examples-label">Try these:</p>
                    <div className="examples-grid">
                        {[
                            "A ninja cat saving Tokyo from a robot invasion",
                            "A space cowboy discovering an alien saloon on Mars",
                            "A superhero grandmother fighting crime with her knitting needles",
                        ].map((example, i) => (
                            <motion.button
                                key={i}
                                className="example-chip"
                                onClick={() => setDescription(example)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={isLoading}
                            >
                                {example}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

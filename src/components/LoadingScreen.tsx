"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
    description: string;
}

const loadingMessages = [
    "Writing the comic script... ✍️",
    "Sketching panel layouts... 🎨",
    "Inking the outlines... 🖊️",
    "Adding vibrant colors... 🌈",
    "Applying halftone shading... ⚫",
    "Lettering speech bubbles... 💬",
    "Adding dramatic effects... 💥",
    "Final touches... ✨",
];

export default function LoadingScreen({ description }: LoadingScreenProps) {
    const [messageIndex, setMessageIndex] = useState(0);
    const [dots, setDots] = useState("");

    useEffect(() => {
        const msgInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 4000);

        const dotInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 500);

        return () => {
            clearInterval(msgInterval);
            clearInterval(dotInterval);
        };
    }, []);

    return (
        <div className="loading-container">
            <div className="loading-halftone" />

            {/* Animated comic panels appearing */}
            <div className="loading-panels">
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="loading-panel"
                        initial={{ opacity: 0, scale: 0, rotate: -15 }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1, 1, 0.8],
                            rotate: [-15, 0, 0, 10],
                        }}
                        transition={{
                            duration: 3,
                            delay: i * 0.8,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: "easeInOut",
                        }}
                    >
                        <div className="panel-placeholder">
                            <div className="panel-lines" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main loading content */}
            <motion.div
                className="loading-content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <motion.div
                    className="loading-burst"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    <div className="burst-shape" />
                </motion.div>

                <h2 className="loading-title">GENERATING YOUR COMIC{dots}</h2>

                <AnimatePresence mode="wait">
                    <motion.p
                        key={messageIndex}
                        className="loading-message"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {loadingMessages[messageIndex]}
                    </motion.p>
                </AnimatePresence>

                <p className="loading-description">&quot;{description}&quot;</p>

                {/* Progress bar */}
                <div className="loading-bar-track">
                    <motion.div
                        className="loading-bar-fill"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 60, ease: "linear" }}
                    />
                </div>

                <p className="loading-hint">
                    This usually takes 1-2 minutes. Hang tight!
                </p>
            </motion.div>
        </div>
    );
}

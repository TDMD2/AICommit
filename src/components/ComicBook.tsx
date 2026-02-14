"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import ComicPage from "./ComicPage";
import type { Spread } from "@/types/comic";

const panelContainerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.4,
        },
    },
};

const panelItemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.85, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

interface ComicBookProps {
    spreads: Spread[];
    title: string;
    onBack: () => void;
}

export default function ComicBook({ spreads, title, onBack }: ComicBookProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSpread, setCurrentSpread] = useState(0);
    const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");

    const openBook = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeBook = useCallback(() => {
        setIsOpen(false);
        setCurrentSpread(0);
    }, []);

    const nextPage = useCallback(() => {
        if (currentSpread < spreads.length - 1) {
            setFlipDirection("next");
            setCurrentSpread((prev) => prev + 1);
        }
    }, [currentSpread, spreads.length]);

    const prevPage = useCallback(() => {
        if (currentSpread > 0) {
            setFlipDirection("prev");
            setCurrentSpread((prev) => prev - 1);
        }
    }, [currentSpread]);

    // Keyboard navigation
    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!isOpen) {
                if (e.key === "Enter" || e.key === " ") openBook();
                return;
            }
            if (e.key === "ArrowRight" || e.key === " ") nextPage();
            if (e.key === "ArrowLeft") prevPage();
            if (e.key === "Escape") closeBook();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, nextPage, prevPage, openBook, closeBook]);

    const spread = spreads[currentSpread];

    return (
        <div className="book-wrapper">
            {/* Back button (always visible) */}
            <motion.button
                className="back-to-create-btn"
                onClick={onBack}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
            >
                ← New Comic
            </motion.button>

            {/* ─── Closed cover ─── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        className="book-cover"
                        onClick={openBook}
                        initial={{ rotateY: -180, opacity: 0, scale: 0.7 }}
                        animate={{
                            rotateY: 0,
                            opacity: 1,
                            scale: 1,
                            transition: {
                                duration: 1.2,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            },
                        }}
                        exit={{
                            rotateY: -170,
                            opacity: 0,
                            scale: 1.05,
                            filter: "brightness(1.3)",
                            transition: {
                                duration: 1.4,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            },
                        }}
                        whileHover={{
                            scale: 1.02,
                            rotateY: -8,
                            boxShadow:
                                "0 0 100px rgba(255, 220, 50, 0.4), 0 30px 80px rgba(0,0,0,0.8)",
                            transition: { duration: 0.4 },
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="book-spine" />
                        <div className="cover-ornament" />
                        <motion.div
                            className="cover-title"
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                        >
                            {title}
                        </motion.div>
                        <div className="cover-ornament" />
                        <div className="open-prompt">⟡ Click to Open ⟡</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Open book pages ─── */}
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        key="book-open"
                        initial={{
                            scale: 0.5,
                            opacity: 0,
                            rotateX: 15,
                            y: 60,
                        }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            rotateX: 0,
                            y: 0,
                        }}
                        exit={{
                            scale: 0.5,
                            opacity: 0,
                            rotateX: -15,
                            y: 60,
                        }}
                        transition={{
                            duration: 0.9,
                            ease: [0.25, 0.46, 0.45, 0.94],
                            delay: 0.2,
                        }}
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "relative",
                            transformStyle: "preserve-3d",
                            perspective: "2500px",
                        }}
                    >
                        {/* Close button */}
                        <motion.button
                            className="close-book-btn"
                            onClick={closeBook}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 0.6, y: 0 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            whileHover={{ opacity: 1, scale: 1.05 }}
                        >
                            ✕ Close
                        </motion.button>

                        {/* Page content with flip animation */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSpread}
                                initial={{
                                    rotateY: flipDirection === "next" ? 90 : -90,
                                    opacity: 0,
                                    scale: 0.95,
                                    transformOrigin:
                                        flipDirection === "next"
                                            ? "left center"
                                            : "right center",
                                    filter: "brightness(0.5)",
                                }}
                                animate={{
                                    rotateY: 0,
                                    opacity: 1,
                                    scale: 1,
                                    filter: "brightness(1)",
                                }}
                                exit={{
                                    rotateY: flipDirection === "next" ? -90 : 90,
                                    opacity: 0,
                                    scale: 0.95,
                                    transformOrigin:
                                        flipDirection === "next"
                                            ? "left center"
                                            : "right center",
                                    filter: "brightness(0.5)",
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    transformStyle: "preserve-3d",
                                    perspective: "2500px",
                                }}
                            >
                                {/* Title page for first spread */}
                                {currentSpread === 0 ? (
                                    <div className="pages-container">
                                        <div className="comic-page">
                                            <div className="title-page">
                                                <div className="ornament-line" />
                                                <h1>{title}</h1>
                                                <div className="ornament-line" />
                                                <p>AI Generated Comic</p>
                                            </div>
                                            <div className="page-number left">i</div>
                                        </div>
                                        <div className="comic-page">
                                            <motion.div
                                                className={`panel-grid ${spread.rightLayout}`}
                                                variants={panelContainerVariants}
                                                initial="hidden"
                                                animate="visible"
                                            >
                                                {spread.rightPanels.map((panel, i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="panel"
                                                        variants={panelItemVariants}
                                                    >
                                                        <img
                                                            src={panel.src}
                                                            alt={`Panel ${i + 1}`}
                                                            loading="lazy"
                                                        />
                                                        {panel.narration && (
                                                            <div className="panel-narration">
                                                                {panel.narration}
                                                            </div>
                                                        )}
                                                        {panel.caption && (
                                                            <div className="panel-caption">
                                                                {panel.caption}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                            <div className="page-number right">1</div>
                                        </div>
                                    </div>
                                ) : (
                                    <ComicPage
                                        leftPanels={spread.leftPanels}
                                        rightPanels={spread.rightPanels}
                                        leftLayout={spread.leftLayout}
                                        rightLayout={spread.rightLayout}
                                        pageNumLeft={currentSpread * 2}
                                        pageNumRight={currentSpread * 2 + 1}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <motion.div
                            className="page-nav"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                        >
                            <motion.button
                                onClick={prevPage}
                                disabled={currentSpread === 0}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                ◂ Prev
                            </motion.button>
                            <span className="page-indicator">
                                {currentSpread + 1} / {spreads.length}
                            </span>
                            <motion.button
                                onClick={nextPage}
                                disabled={currentSpread === spreads.length - 1}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Next ▸
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

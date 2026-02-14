"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";

interface ComicPageProps {
    leftPanels: { src: string; caption?: string; narration?: string }[];
    rightPanels: { src: string; caption?: string; narration?: string }[];
    leftLayout: string;
    rightLayout: string;
    pageNumLeft: number;
    pageNumRight: number;
}

const panelItemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.85, y: 15 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

export default function ComicPage({
    leftPanels,
    rightPanels,
    leftLayout,
    rightLayout,
    pageNumLeft,
    pageNumRight,
}: ComicPageProps) {
    const renderPanels = (
        panels: { src: string; caption?: string; narration?: string }[],
        layout: string,
        delayOffset: number
    ) => {
        const containerVariants: Variants = {
            hidden: {},
            visible: {
                transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.3 + delayOffset,
                },
            },
        };

        return (
            <motion.div
                className={`panel-grid ${layout}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {panels.map((panel, i) => (
                    <motion.div key={i} className="panel" variants={panelItemVariants}>
                        <img src={panel.src} alt={`Panel ${i + 1}`} loading="lazy" />
                        {panel.narration && (
                            <motion.div
                                className="panel-narration"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + delayOffset + i * 0.1, duration: 0.4 }}
                            >
                                {panel.narration}
                            </motion.div>
                        )}
                        {panel.caption && (
                            <motion.div
                                className="panel-caption"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + delayOffset + i * 0.1, duration: 0.4 }}
                            >
                                {panel.caption}
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </motion.div>
        );
    };

    return (
        <div className="pages-container">
            {/* Left page */}
            <div className="comic-page">
                {renderPanels(leftPanels, leftLayout, 0)}
                <div className="page-number left">{pageNumLeft}</div>
            </div>

            {/* Right page */}
            <div className="comic-page">
                {renderPanels(rightPanels, rightLayout, 0.2)}
                <div className="page-number right">{pageNumRight}</div>
            </div>
        </div>
    );
}

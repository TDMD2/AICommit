"use client";

import React from "react";

const PARTICLE_COUNT = 30;

export default function Particles() {
    return (
        <div className="particles-container">
            {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
                const left = Math.random() * 100;
                const delay = Math.random() * 8;
                const duration = 6 + Math.random() * 6;
                const size = 2 + Math.random() * 3;

                return (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${left}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                            animationDelay: `${delay}s`,
                            animationDuration: `${duration}s`,
                        }}
                    />
                );
            })}
        </div>
    );
}

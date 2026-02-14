"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ComicCanvas from "@/components/ComicCanvas";
import type { Spread } from "@/types/comic";

export default function Home() {
  const [story, setStory] = useState("");
  const [style, setStyle] = useState("");
  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [grid, setGrid] = useState<"grid-1" | "grid-2" | "grid-4" | "grid-3a" | "grid-3b" | "grid-4s">("grid-1");
  const [selectedPanel, setSelectedPanel] = useState<number | null>(null);
  const [captions, setCaptions] = useState(true);
  const [bubbles, setBubbles] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSpreads([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: story, // Keeping description for backward compat logic helper, but mainly using story/style
          story,
          style,
          format: grid === "grid-1" ? "slide" : "comic",
          grid,
          captions,
          bubbles,
          selectedPanel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setSpreads(data.spreads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main>
      <ComicCanvas
        grid={grid}
        spread={spreads.length > 0 ? spreads[0] : null}
        isGenerating={isGenerating}
        selectedPanel={selectedPanel}
        onSelectPanel={(index: number | null) => setSelectedPanel(index)}
      />

      <Sidebar
        story={story}
        setStory={setStory}
        style={style}
        setStyle={setStyle}
        grid={grid}
        setGrid={setGrid}
        captions={captions}
        setCaptions={setCaptions}
        bubbles={bubbles}
        setBubbles={setBubbles}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        selectedPanel={selectedPanel}
        onDeselectPanel={() => setSelectedPanel(null)}
        error={error}
      />
    </main>
  );
}

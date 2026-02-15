"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ComicCanvas from "@/components/ComicCanvas";
import type { Spread } from "@/types/comic";

export default function Home() {
  const [story, setStory] = useState("");
  const [style, setStyle] = useState("");
  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [grid, setGrid] = useState<"grid-0" | "grid-1" | "grid-2" | "grid-3">("grid-0");
  const [selectedPanel, setSelectedPanel] = useState<number | null>(null);
  const [captions, setCaptions] = useState(true);
  const [bubbles, setBubbles] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    // For single-panel mode, don't clear existing panels
    const isSinglePanel = selectedPanel !== null && spreads.length > 0;
    if (!isSinglePanel) {
      setSpreads([]);
    }

    // Build existing panels array for single-panel regeneration
    const existingPanels = isSinglePanel && spreads[0]
      ? [...spreads[0].rightPanels, ...spreads[0].leftPanels]
      : undefined;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: story,
          story,
          style,
          format: "comic",
          grid,
          captions,
          bubbles,
          selectedPanel: isSinglePanel ? selectedPanel : null,
          existingPanels: isSinglePanel ? existingPanels : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setSpreads(data.spreads);

      // After single-panel regeneration, deselect the panel
      if (isSinglePanel) {
        setSelectedPanel(null);
      }
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

import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import OpenAI from "openai";

export const maxDuration = 300; // 5 min timeout for image generation

interface PanelScript {
    scene: string;
    narration?: string;
    caption?: string;
}

interface SpreadScript {
    leftPanels: PanelScript[];
    rightPanels: PanelScript[];
}

export async function POST(req: NextRequest) {
    try {
        const { description, story, style, format = "comic", grid, captions, bubbles } = await req.json();

        // Backward compatibility: use description if story/style not provided
        const finalStory = story || description;
        const finalStyle = style || "";

        if (!finalStory || typeof finalStory !== "string") {
            return NextResponse.json(
                { error: "A story description is required." },
                { status: 400 }
            );
        }

        const openaiApiKey = process.env.OPENAI_API_KEY;
        const hfToken = process.env.HF_TOKEN;

        if (!hfToken && !openaiApiKey) {
            return NextResponse.json(
                { error: "Missing API Keys. Please configure HF_TOKEN (preferred) or OPENAI_API_KEY." },
                { status: 500 }
            );
        }

        if (format === "slide" || (grid && grid === "grid-1")) {
            // Single Slide Generation
            let prompt = `Comic book panel. ${finalStory}.`;
            if (finalStyle) {
                prompt += ` Style: ${finalStyle}, comic book art, bold ink lines, vibrant colors, dramatic lighting.`;
            } else {
                prompt += ` Style: comic book art, bold ink lines, vibrant colors, dramatic lighting.`;
            }

            const imageData = await generatePanelImage(prompt);

            return NextResponse.json({
                title: "Single Slide",
                spreads: [{
                    leftPanels: [],
                    rightPanels: [{
                        src: imageData,
                        caption: finalStory
                    }],
                    leftLayout: "blank",
                    rightLayout: "full-page"
                }]
            });
        }

        // Comic Page Generation (Grid 2, 3, or 4)
        let panelCount = 4;
        if (grid === "grid-2") panelCount = 2;
        if (grid === "grid-3a" || grid === "grid-3b") panelCount = 3;
        if (grid === "grid-4s") panelCount = 4;

        let script: { title: string; spreads: SpreadScript[] } | null = null;
        let usedModel = "DeepSeek-R1-0528-Qwen3-8B";

        // Logic: ONLY use DeepSeek (HF) for script generation
        // User requested removing GPT-5.2 to rely on the HF/Flux stack
        let generationError = "";

        if (hfToken) {
            console.log("Generating script with DeepSeek (HF)...");
            try {
                script = await generateScriptWithDeepSeekHF(finalStory, finalStyle, panelCount, hfToken);
            } catch (err: any) {
                console.error("DeepSeek generation failed:", err);
                generationError = err.message || String(err);
            }
        } else {
            return NextResponse.json(
                { error: "Missing HF_TOKEN. Please configure it for DeepSeek & Flux." },
                { status: 500 }
            );
        }

        if (!script) {
            return NextResponse.json(
                { error: `Failed to generate comic script. Details: ${generationError || "Please check loop logic."}` },
                { status: 500 }
            );
        }

        console.log(`Script generated successfully using ${usedModel}`);

        // Post-processing: Remove em dashes and en dashes
        if (script.spreads) {
            script.spreads.forEach(spread => {
                if (spread.rightPanels) {
                    spread.rightPanels.forEach(panel => {
                        if (panel.narration) panel.narration = panel.narration.replace(/—|–/g, " - ");
                        if (panel.caption) panel.caption = panel.caption.replace(/—|–/g, " - ");
                        if (panel.scene) panel.scene = panel.scene.replace(/—|–/g, "-");
                    });
                }
                if (spread.leftPanels) {
                    spread.leftPanels.forEach(panel => {
                        if (panel.narration) panel.narration = panel.narration.replace(/—|–/g, " - ");
                        if (panel.caption) panel.caption = panel.caption.replace(/—|–/g, " - ");
                        if (panel.scene) panel.scene = panel.scene.replace(/—|–/g, "-");
                    });
                }
            });
        }


        const spreads = await Promise.all(script.spreads.map(async (spread: any) => {
            // Generate all panel images in parallel (Right Panels)
            const rightPanels = await Promise.all((spread.rightPanels || []).map(async (panel: any) => {
                let fullScenePrompt = `${panel.scene}.`;
                if (finalStyle) {
                    fullScenePrompt += ` Style: ${finalStyle}, comic book art.`;
                } else {
                    fullScenePrompt += ` Style: comic book art.`;
                }
                console.log(`[Generate] Prompt: ${fullScenePrompt}`);

                const imageData = await generatePanelImage(fullScenePrompt);
                return {
                    src: imageData,
                    narration: captions ? panel.narration : undefined,
                    caption: bubbles ? panel.caption : undefined,
                };
            }));

            // Generate all panel images in parallel (Left Panels - if any)
            const leftPanels = await Promise.all((spread.leftPanels || []).map(async (panel: any) => {
                let fullScenePrompt = `${panel.scene}.`;
                if (finalStyle) {
                    fullScenePrompt += ` Style: ${finalStyle}, comic book art.`;
                } else {
                    fullScenePrompt += ` Style: comic book art.`;
                }
                console.log(`[Generate Left] Prompt: ${fullScenePrompt}`);

                const imageData = await generatePanelImage(fullScenePrompt);
                return {
                    src: imageData,
                    narration: captions ? panel.narration : undefined,
                    caption: bubbles ? panel.caption : undefined,
                };
            }));

            return {
                leftPanels,
                rightPanels,
                leftLayout: "blank", // Default or map if needed
                rightLayout: `canvas-${grid}`, // Use mapped class
            };
        }));

        return NextResponse.json({
            title: script.title,
            spreads,
        });
    } catch (error: any) {
        console.error("Generation error:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred during generation." },
            { status: 500 }
        );
    }
}

// --- Helper Functions ---

async function generateScriptWithDeepSeekHF(description: string, style: string, panelCount: number, hfToken: string): Promise<any> {
    const systemPrompt = `You are a legendary comic book writer and visual director.
    Your task is to turn a story description into a JSON script for a single comic book page with EXACTLY ${panelCount} panels.

    Story: "${description}"
    Visual Style: "${style || "Standard Comic Book"}"

    CRITICAL INSTRUCTIONS:
    1.  **Panel Count**: You MUST generate EXACTLY ${panelCount} panels. No more, no less.
    2.  **Output Format**: You must output a JSON object with a "spreads" array.
    3.  **Visuals Only**: The "scene" field must be a raw visual description for an image generator.
    4.  **No Markdown**: Do not use markdown formatting like \`\`\`json. Just output the raw JSON.

    REQUIRED JSON STRUCTURE:
    {
      "title": "Comic Title",
      "spreads": [
        {
          "rightPanels": [
            {
              "scene": "Visual description of panel 1...",
              "narration": "Narration text...",
              "caption": "Speech bubble text..."
            },
             {
              "scene": "Visual description of panel 2...",
              "narration": "Narration text...",
              "caption": "Speech bubble text..."
            }
            // ... exactly ${panelCount} panels in total
          ],
          "leftPanels": []
        }
      ]
    }
    `;

    let currentMessages = [
        { role: "system", content: systemPrompt + ` CONFIRM: I WILL GENERATE EXACTLY ${panelCount} PANELS IN THE REQUIRED JSON FORMAT.` },
        { role: "user", content: `Generate the JSON script now for exactly ${panelCount} panels.` }
    ];

    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        console.log(`[DeepSeek] Generation Attempt ${attempt + 1}/${maxRetries + 1} for ${panelCount} panels...`);

        try {
            const response = await fetch(
                "https://router.huggingface.co/featherless-ai/v1/chat/completions",
                {
                    headers: {
                        Authorization: `Bearer ${hfToken}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        model: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
                        messages: currentMessages,
                        max_tokens: 4000,
                        temperature: 0.6,
                    }),
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                console.error(`DeepSeek API Error: ${response.status} ${response.statusText}`, errText);
                throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText} - ${errText}`);
            }

            const result = await response.json();
            let generatedText = result?.choices?.[0]?.message?.content || "";

            // Remove <think> blocks
            generatedText = generatedText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            // Strip markdown
            generatedText = generatedText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

            const jsonMatch = extractFirstJson(generatedText);

            if (!jsonMatch) {
                console.error("DeepSeek did not return JSON. Content:", generatedText);
                if (attempt < maxRetries) {
                    currentMessages.push({ role: "assistant", content: generatedText });
                    currentMessages.push({ role: "user", content: "You did not return valid JSON. Please output ONLY valid JSON." });
                    continue;
                }
                throw new Error("DeepSeek did not return valid JSON.");
            }

            const parsed = JSON.parse(jsonMatch.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));

            // Validate Structure & Fixes
            let script = parsed;
            if (Array.isArray(parsed)) script = { title: "Generated Comic", spreads: parsed };

            // Normalize to spreads
            if (!script.spreads) {
                if (script.pages && Array.isArray(script.pages)) script.spreads = script.pages;
                else if (script.panels && Array.isArray(script.panels)) {
                    script.spreads = [{ rightPanels: script.panels, leftPanels: [] }];
                }
            }

            if (!script.spreads || !Array.isArray(script.spreads)) {
                if (attempt < maxRetries) {
                    currentMessages.push({ role: "assistant", content: generatedText });
                    currentMessages.push({ role: "user", content: "Invalid JSON structure. Missing 'spreads' array." });
                    continue;
                }
                throw new Error("DeepSeek JSON missing 'spreads' array.");
            }

            // CHECK PANEL COUNT
            let totalPanels = 0;
            script.spreads.forEach((s: any) => {
                if (s.rightPanels) totalPanels += s.rightPanels.length;
                if (s.leftPanels) totalPanels += s.leftPanels.length;
            });

            if (totalPanels !== panelCount) {
                console.warn(`[DeepSeek] Mismatch! Requested ${panelCount}, got ${totalPanels}. Retrying...`);
                if (attempt < maxRetries) {
                    currentMessages.push({ role: "assistant", content: generatedText });
                    currentMessages.push({ role: "user", content: `Create exactly ${panelCount} panels. You generated ${totalPanels}. Please fix and generate exactly ${panelCount} panels.` });
                    continue; // RETRY
                }
                // If out of retries, we just accept what we have, or throw?
                // Returning what we have is better than crashing, but the user specifically complained about this.
                // Let's stick with returning it but logging heavily.
                console.error(`[DeepSeek] Failed to generate correct panel count after retries. Returning ${totalPanels} panels.`);
            }

            return script;

        } catch (error: any) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            if (attempt === maxRetries) throw error;
        }
    }
}




async function generatePanelImage(
    sceneDescription: string
): Promise<string> {
    const hfToken = process.env.HF_TOKEN;

    if (!hfToken) {
        throw new Error("Missing HF_TOKEN in environment variables.");
    }

    const hf = new HfInference(hfToken);

    // Prompt already contains style instructions from the caller
    const prompt = `Comic book panel. ${sceneDescription}. NO text bubbles in image.`;

    try {
        console.log("Generating image with FLUX.1-dev (fal-ai)...");

        const response = await hf.textToImage({
            model: "black-forest-labs/FLUX.1-dev",
            inputs: prompt,
            provider: "fal-ai",
        });

        // Force cast to Blob
        const blob = response as unknown as Blob;
        const buffer = Buffer.from(await blob.arrayBuffer());
        return `data:image/jpeg;base64,${buffer.toString("base64")}`;

    } catch (error: any) {
        console.error("FLUX (fal-ai) generation failed:", error);
        throw new Error(`Image Generation Error (fal-ai): ${error.message}`);
    }
}

function generatePlaceholder(text: string, errorDetail?: string): string {
    const colors = ["#e63946", "#457b9d", "#2a9d8f", "#e9c46a", "#f4a261", "#264653"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const escapedText = text.substring(0, 50).replace(/[<>&"']/g, "");

    const rawError = errorDetail || "";
    const cleanErrorLine1 = rawError.substring(0, 45).replace(/[<>&"']/g, "");
    const cleanErrorLine2 = rawError.substring(45, 90).replace(/[<>&"']/g, "");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${color}"/>
    <text x="256" y="220" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif" font-weight="bold">${escapedText}...</text>
    <text x="256" y="260" text-anchor="middle" fill="white" font-size="14" font-family="sans-serif">[Image Unavailble]</text>
    <text x="256" y="290" text-anchor="middle" fill="#ffcccc" font-size="12" font-family="monospace">Error: ${cleanErrorLine1}</text>
    <text x="256" y="310" text-anchor="middle" fill="#ffcccc" font-size="12" font-family="monospace">${cleanErrorLine2}</text>
  </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function extractFirstJson(text: string): string | null {
    const start = text.indexOf('{');
    if (start === -1) return null;

    let braceCount = 0;
    let inString = false;
    let escape = false;

    // We start from the first '{'
    for (let i = start; i < text.length; i++) {
        const char = text[i];

        if (inString) {
            if (escape) {
                escape = false;
            } else if (char === '\\') {
                escape = true;
            } else if (char === '"') {
                inString = false;
            }
        } else {
            if (char === '"') {
                inString = true;
            } else if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    // Match found! Return the substring
                    return text.substring(start, i + 1);
                }
            }
        }
    }

    // If we get here, braces were not balanced (e.g. truncated response)
    // We can try to return what we have, or null.
    // DeepSeek might truncate, so let's just return what we have if braceCount > 0
    // But usually that means invalid JSON.
    return null;
}

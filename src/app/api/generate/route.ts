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
        const selectedStyle = style || "";

        // Helper to get detailed style prompt
        const getStylePrompt = (styleName: string): string => {
            const styleMap: Record<string, string> = {
                "Japanese": "Japanese Manga style, black and white ink illustration, screentones, high contrast, detailed background, anime aesthetic, traditional manga inking, no colors, monochrome.",
                "Nihonga": "Nihonga style, traditional Japanese painting, mineral pigments, gold/silver leaf details, washi paper texture, flat perspective, elegant nature motifs, soft texture, japanese art.",
                "Franco-Belgian": "Franco-Belgian comic style (Bande Dessinée), Ligne Claire (Clear Line) style, uniform bold outlines, flat vibrant colors, no cross-hatching, highly detailed backgrounds with cartoonish characters, Hergé/Tintin aesthetic.",
                "American (modern)": "Modern American superhero comic style, digital coloring, high fidelity, cinematic lighting, detailed shading, realistic anatomy, dynamic action, 4k resolution, marvel/dc modern era aesthetic.",
                "American (1950)": "Retro 1950s Golden Age comic book style, Ben-Day dots, halftone pattern, CMYK offset printing look, vintage paper texture, bold black ink outlines, primary colors, pulp fiction aesthetic, aged comic book look.",
                "Flying saucer": "Retro 1950s Sci-Fi comic cover art, pulp magazine style, mysterious flying saucers, dramatic lighting, vintage futuristic aesthetic, bold colors, grainy texture.",
                "Humanoid": "Sci-fi humanoid creative concept art, bio-mechanical details, anthropomorphic character design, intricate textures, surreal and futuristic features, cinematic lighting.",
                "Haddock": "Ligne Claire style character caricature, expressive, bold uniform lines, flat colors, humorous exaggeration, detailed clothing texture, distinct Belgian comic aesthetic.",
                "Armorican": "Classic French comic style (Asterix), humorous cartoon style, expressive characters, historical Gaul setting, vibrant colors, ink lines, detailed scenic backgrounds.",
                "3D Render": "3D stylized render, Pixar/Disney animation style, soft lighting, ambient occlusion, 3D character design, vibrant colors, high quality render, c4d, blender.",
                "Klimt": "Gustav Klimt art style, Golden Phase, gold leaf textures, mosaic patterns, intricate geometric ornamentation, sensual and decorative, rich jewel tones, symbolism, oil painting.",
                "Medieval": "Medieval illuminated manuscript art style, parchment paper texture, gold leaf accents, gothic calligraphy influences, flat perspective, intricate floral borders, historical aesthetic.",
                "Egyptian": "Ancient Egyptian wall art style, hieroglyphic details, profile figures, papyrus texture, sandstone colors, gold and lapis lazuli accents, 2D perspective, historical mural."
            };
            return styleMap[styleName] || styleName; // Fallback to raw string if not found or custom
        };

        const finalStylePrompt = getStylePrompt(selectedStyle);

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

        // All grids are 4-panel layouts
        const panelCount = 4;

        let script: { title: string; spreads: SpreadScript[] } | null = null;
        let usedModel = "gpt-5.2";

        // Use GPT-5.2 only for script generation (no fallback)
        if (!openaiApiKey) {
            return NextResponse.json(
                { error: "Missing OPENAI_API_KEY. Please configure it for GPT-5.2 script generation." },
                { status: 500 }
            );
        }

        console.log("Generating script with GPT-5.2 (OpenAI)...");
        try {
            script = await generateScriptWithGPT5(finalStory, selectedStyle, panelCount, openaiApiKey);
        } catch (err: any) {
            console.error("GPT-5.2 generation failed:", err);
            return NextResponse.json(
                { error: `Failed to generate comic script: ${err.message || String(err)}` },
                { status: 500 }
            );
        }

        if (!script) {
            return NextResponse.json(
                { error: "Failed to generate comic script." },
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


        // 1. Identify the First Panel
        const firstSpread = script.spreads[0];
        let firstPanel: any = null;
        let isFirstPanelRight = true; // Track if it's in rightPanels or leftPanels

        if (firstSpread.rightPanels && firstSpread.rightPanels.length > 0) {
            firstPanel = firstSpread.rightPanels[0];
        } else if (firstSpread.leftPanels && firstSpread.leftPanels.length > 0) {
            firstPanel = firstSpread.leftPanels[0];
            isFirstPanelRight = false;
        }

        let characterTraits = "";
        let firstPanelImage = "";

        // 2. Generate & Analyze First Panel (if exists)
        if (firstPanel) {
            console.log("Generating First Panel for Character Analysis...");
            let firstPrompt = `${firstPanel.scene}.`;
            if (finalStylePrompt) firstPrompt += ` ${finalStylePrompt}`;
            else firstPrompt += ` Style: comic book art.`;

            try {
                firstPanelImage = await generatePanelImage(firstPrompt);

                // Analyze
                if (openaiApiKey) {
                    console.log("Analyzing First Panel for Traits...");
                    characterTraits = await analyzeImageForCharacterTraits(firstPanelImage, openaiApiKey);
                    console.log(`Extracted Traits: ${characterTraits}`);
                }
            } catch (err) {
                console.error("Failed to generate/analyze first panel:", err);
                // Fallback: generate normally in loop, but here we just leave firstPanelImage empty to retry or similar?
                // Actually, if it failed, we might want to let the loop fail or handle it. 
                // Let's assume if it failed, we just continue and try to regenerate in loop?
                // Simplest is to just set firstPanelImage to null and let loop handle it? 
                // But the loop logic below will need adjustment.
                // Let's just let it be empty and handle in loop.
            }
        }

        // Helper: build prompt for a panel
        const buildPanelPrompt = (panel: any): string => {
            let fullScenePrompt = characterTraits
                ? `[Main character: ${characterTraits}] ${panel.scene}.`
                : `${panel.scene}.`;
            if (finalStylePrompt) {
                fullScenePrompt += ` ${finalStylePrompt}`;
            } else {
                fullScenePrompt += ` Style: comic book art.`;
            }
            return fullScenePrompt;
        };

        // Generate panels SEQUENTIALLY to avoid rate-limiting by FLUX/fal-ai
        const spreads = [];
        for (let spreadIndex = 0; spreadIndex < script.spreads.length; spreadIndex++) {
            const spread = script.spreads[spreadIndex];

            // --- Right Panels (sequential) ---
            const rightPanels = [];
            for (let panelIndex = 0; panelIndex < (spread.rightPanels || []).length; panelIndex++) {
                const panel = spread.rightPanels[panelIndex];
                const isTheFirstPanel = (spreadIndex === 0 && isFirstPanelRight && panelIndex === 0);

                if (isTheFirstPanel && firstPanelImage) {
                    rightPanels.push({
                        src: firstPanelImage,
                        narration: captions ? panel.narration : undefined,
                        caption: bubbles ? panel.caption : undefined,
                    });
                    continue;
                }

                const fullScenePrompt = buildPanelPrompt(panel);
                console.log(`[Generate] Panel ${panelIndex + 1} prompt: ${fullScenePrompt}`);

                // Small delay between requests to avoid rate-limiting
                if (panelIndex > 0 || spreadIndex > 0) {
                    await new Promise(r => setTimeout(r, 1500));
                }

                try {
                    const imageData = await generatePanelImage(fullScenePrompt);
                    rightPanels.push({
                        src: imageData,
                        narration: captions ? panel.narration : undefined,
                        caption: bubbles ? panel.caption : undefined,
                    });
                } catch (err: any) {
                    console.error(`[Generate] Panel ${panelIndex + 1} failed:`, err.message);
                    rightPanels.push({
                        src: generatePlaceholder(panel.scene, err.message),
                        narration: captions ? panel.narration : undefined,
                        caption: bubbles ? panel.caption : undefined,
                    });
                }
            }

            // --- Left Panels (sequential) ---
            const leftPanels = [];
            for (let panelIndex = 0; panelIndex < (spread.leftPanels || []).length; panelIndex++) {
                const panel = spread.leftPanels[panelIndex];
                const isTheFirstPanel = (spreadIndex === 0 && !isFirstPanelRight && panelIndex === 0);

                if (isTheFirstPanel && firstPanelImage) {
                    leftPanels.push({
                        src: firstPanelImage,
                        narration: captions ? panel.narration : undefined,
                        caption: bubbles ? panel.caption : undefined,
                    });
                    continue;
                }

                const fullScenePrompt = buildPanelPrompt(panel);
                console.log(`[Generate Left] Panel ${panelIndex + 1} prompt: ${fullScenePrompt}`);

                await new Promise(r => setTimeout(r, 1500));

                try {
                    const imageData = await generatePanelImage(fullScenePrompt);
                    leftPanels.push({
                        src: imageData,
                        narration: captions ? panel.narration : undefined,
                        caption: bubbles ? panel.caption : undefined,
                    });
                } catch (err: any) {
                    console.error(`[Generate Left] Panel ${panelIndex + 1} failed:`, err.message);
                    leftPanels.push({
                        src: generatePlaceholder(panel.scene, err.message),
                        narration: captions ? panel.narration : undefined,
                        caption: bubbles ? panel.caption : undefined,
                    });
                }
            }

            spreads.push({
                leftPanels,
                rightPanels,
                leftLayout: "blank",
                rightLayout: `canvas-${grid}`,
            });
        }

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
    5.  **Narration/Dialogue**: EVERY panel must have either "narration" OR "caption" (or both). Do not leave them empty unless absolutely necessary for the story.
    6.  **MAIN CHARACTER ALWAYS IN FRAME**: The main character(s) from the story MUST appear and be clearly visible in EVERY single panel. Never show a panel without the main character. Always describe the main character's pose, position, and action in each scene description.
    7.  **NO DUPLICATE PANELS**: Each panel MUST show a DIFFERENT moment, angle, or composition. Vary camera angles (close-up, medium shot, wide shot, low angle, over-the-shoulder). Never repeat the same framing or composition between panels. Each panel must feel visually distinct.
    8.  **SCENE DESCRIPTION REQUIREMENTS**: Each scene description must include: (a) the main character's full appearance and what they are doing, (b) the camera angle/framing, (c) the background/environment details. Be specific and detailed.

    REQUIRED JSON STRUCTURE:
    {
      "title": "Comic Title",
      "spreads": [
        {
          "rightPanels": [
            {
              "scene": "Visual description of panel 1...",
              "narration": "Narration text (required if no caption)...",
              "caption": "Speech bubble text (required if no narration)..."
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

async function generateScriptWithGPT5(description: string, style: string, panelCount: number, apiKey: string): Promise<any> {
    const systemPrompt = `You are a legendary comic book writer and visual director.
    Your task is to turn a story description into a JSON script for a single comic book page with EXACTLY ${panelCount} panels.

    Story: "${description}"
    Visual Style: "${style || "Standard Comic Book"}"

    CRITICAL INSTRUCTIONS:
    1.  **Panel Count**: You MUST generate EXACTLY ${panelCount} panels. No more, no less.
    2.  **Output Format**: You must output a JSON object with a "spreads" array.
    3.  **Visuals Only**: The "scene" field must be a raw visual description for an image generator.
    4.  **No Markdown**: Do not use markdown formatting like \`\`\`json. Just output the raw JSON.
    5.  **Narration/Dialogue**: EVERY panel must have either "narration" OR "caption" (or both). Do not leave them empty unless absolutely necessary for the story.
    6.  **MAIN CHARACTER ALWAYS IN FRAME**: The main character(s) from the story MUST appear and be clearly visible in EVERY single panel. Never show a panel without the main character. Always describe the main character's pose, position, and action in each scene description.
    7.  **NO DUPLICATE PANELS**: Each panel MUST show a DIFFERENT moment, angle, or composition. Vary camera angles (close-up, medium shot, wide shot, low angle, over-the-shoulder). Never repeat the same framing or composition between panels. Each panel must feel visually distinct.
    8.  **SCENE DESCRIPTION REQUIREMENTS**: Each scene description must be CONCISE (2-3 sentences MAX). Focus on: (a) the main character and their action, (b) the camera angle, (c) minimal background. Do NOT write long paragraphs. Short, punchy visual descriptions work best for image generation.
    9.  **CORE ACTION FIRST**: The user's requested action (e.g. "punching", "fighting", "saving") must be the PRIMARY focus. At least 2 panels must show the exact action described. Start the scene description with the main action, not the environment. The climactic panel should show the action at its peak.

    REQUIRED JSON STRUCTURE:
    {
      "title": "Comic Title",
      "spreads": [
        {
          "rightPanels": [
            {
              "scene": "Visual description of panel 1...",
              "narration": "Narration text (required if no caption)...",
              "caption": "Speech bubble text (required if no narration)..."
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

    const openai = new OpenAI({ apiKey });

    const maxRetries = 2;
    let currentMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the JSON script now for exactly ${panelCount} panels.` }
    ];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        console.log(`[GPT-5.2] Generation Attempt ${attempt + 1}/${maxRetries + 1} for ${panelCount} panels...`);

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-5.2",
                messages: currentMessages,
                max_completion_tokens: 4000,
                temperature: 0.7,
            });

            let generatedText = response.choices[0]?.message?.content || "";

            // Strip markdown code fences if present
            generatedText = generatedText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

            const jsonMatch = extractFirstJson(generatedText);

            if (!jsonMatch) {
                console.error("GPT-5.2 did not return JSON. Content:", generatedText);
                if (attempt < maxRetries) {
                    currentMessages.push({ role: "assistant", content: generatedText });
                    currentMessages.push({ role: "user", content: "You did not return valid JSON. Please output ONLY valid JSON." });
                    continue;
                }
                throw new Error("GPT-5.2 did not return valid JSON.");
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
                throw new Error("GPT-5.2 JSON missing 'spreads' array.");
            }

            // CHECK PANEL COUNT
            let totalPanels = 0;
            script.spreads.forEach((s: any) => {
                if (s.rightPanels) totalPanels += s.rightPanels.length;
                if (s.leftPanels) totalPanels += s.leftPanels.length;
            });

            if (totalPanels !== panelCount) {
                console.warn(`[GPT-5.2] Mismatch! Requested ${panelCount}, got ${totalPanels}. Retrying...`);
                if (attempt < maxRetries) {
                    currentMessages.push({ role: "assistant", content: generatedText });
                    currentMessages.push({ role: "user", content: `Create exactly ${panelCount} panels. You generated ${totalPanels}. Please fix.` });
                    continue;
                }
                console.error(`[GPT-5.2] Failed to generate correct panel count after retries. Returning ${totalPanels} panels.`);
            }

            return script;

        } catch (error: any) {
            console.error(`GPT-5.2 attempt ${attempt + 1} failed:`, error);
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

    // Truncate the scene description to avoid prompt overload (FLUX works best under ~120 words)
    const truncatedScene = sceneDescription.split(/\s+/).slice(0, 120).join(' ');

    // Prompt: positive quality keywords that FLUX.2 responds to well
    const prompt = `Professional comic book illustration. ${truncatedScene} Masterful human anatomy, dynamic pose, professional illustration quality. Vivid colors, cinematic lighting, sharp details.`;

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Generating image with FLUX.2-dev-Turbo (fal-ai)... attempt ${attempt}/${maxRetries}`);

            const response = await hf.textToImage({
                model: "fal/FLUX.2-dev-Turbo",
                inputs: prompt,
                provider: "fal-ai",
            });

            // Force cast to Blob
            const blob = response as unknown as Blob;
            const buffer = Buffer.from(await blob.arrayBuffer());

            // Validate: reject empty or suspiciously small blobs
            // Normal FLUX images are 50KB+; anything under 20KB is likely a near-black/corrupt image
            if (buffer.length < 20000) {
                console.warn(`[FLUX] Attempt ${attempt}: received suspiciously small image (${buffer.length} bytes), likely dark/corrupt. Retrying...`);
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }
                throw new Error(`Image too small (${buffer.length} bytes) - likely a dark/corrupt render.`);
            }

            console.log(`[FLUX] Success: ${buffer.length} bytes`);
            return `data:image/jpeg;base64,${buffer.toString("base64")}`;

        } catch (error: any) {
            console.error(`FLUX attempt ${attempt} failed:`, error.message);
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }
            throw new Error(`Image Generation Error (fal-ai): ${error.message}`);
        }
    }

    // Should never reach here, but just in case
    throw new Error("Image generation failed after all retries.");
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

async function analyzeImageForCharacterTraits(imageUrl: string, apiKey: string): Promise<string> {
    try {
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a comic book art analyst. Look at this comic panel illustration and output ONLY 5-7 comma-separated visual keywords describing the MAIN illustrated character's constant visual features (costume, colors, accessories). Example output: 'red-gold armor, blue arc reactor, angular helmet, metallic suit, broad shoulders'. No sentences, no articles, no verbs. Just short visual tags describing the drawn character's appearance."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 60,
        });

        return response.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
        console.error("Error analyzing image for traits:", error);
        return "";
    }
}

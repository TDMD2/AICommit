import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function testFluxFal() {
    const token = process.env.HF_TOKEN;
    if (!token) {
        console.error("❌ No HF_TOKEN found");
        return;
    }

    console.log("Testing black-forest-labs/FLUX.2-dev via fal-ai...");

    // Constructing URL based on standard HF router patterns for providers
    // Pattern: https://router.huggingface.co/{provider}/models/{model_id}
    const url = "https://router.huggingface.co/fal-ai/models/black-forest-labs/FLUX.2-dev";

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: "A futuristic city with flying cars, comic book style.",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed: ${response.status} ${response.statusText}`);
            console.error(`Body: ${errorText}`);
        } else {
            console.log("✅ Success! Status:", response.status);
            const blob = await response.blob();
            console.log("Received blob size:", blob.size);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

testFluxFal();

import fetch from 'node-fetch';

async function testGeneration() {
    const prompt = "Haddock a tintin styæe cp,oc with an adventure in the desert";
    const style = "Tintin/Herge style";

    console.log("Testing generation with prompt:", prompt);

    try {
        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                story: prompt,
                style: style,
                grid: 'grid-4s', // Testing the Quad Asym that was problematic
                captions: true,
                bubbles: true
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error ${response.status}: ${text}`);
        }

        const data = await response.json();
        console.log("Success! Generated Script:");
        console.log(JSON.stringify(data, null, 2));

        // Validate panel count
        let panelCount = 0;
        if (data.spreads) {
            data.spreads.forEach(s => {
                if (s.rightPanels) panelCount += s.rightPanels.length;
                if (s.leftPanels) panelCount += s.leftPanels.length;
            });
        }
        console.log(`Total Panels Generated: ${panelCount}`);

        let layoutCorrect = true;
        if (data.spreads && data.spreads[0]) {
            const layout = data.spreads[0].rightLayout;
            console.log(`Layout returned: ${layout}`);
            if (layout !== 'canvas-grid-4s') {
                console.error("FAILED: Incorrect layout class. Expected 'canvas-grid-4s'.");
                layoutCorrect = false;
            } else {
                console.log("PASSED: Correct layout class 'canvas-grid-4s'.");
            }
        }

        if (panelCount === 4 && layoutCorrect) {
            console.log("ALL TESTS PASSED: Correct panel count and layout.");
        } else {
            console.error("TESTS FAILED.");
        }

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testGeneration();

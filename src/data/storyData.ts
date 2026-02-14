// Comic story data: "The Amazing Spider-Man"
// Each spread has a left and right page, each with panels

export interface Panel {
    src: string;
    caption?: string;
    narration?: string;
}

export interface Spread {
    leftPanels: Panel[];
    rightPanels: Panel[];
    leftLayout: string; // CSS class
    rightLayout: string;
}

// NYC / action themed images from Unsplash
const IMG = {
    nyc_skyline: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
    nyc_night: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80",
    nyc_street: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    nyc_alley: "https://images.unsplash.com/photo-1555424681-b0ecf4fe19a5?w=800&q=80",
    nyc_bridge: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&q=80",
    skyscraper_lookup: "https://images.unsplash.com/photo-1478860409698-8707f313ee8b?w=800&q=80",
    rooftop: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80",
    times_square: "https://images.unsplash.com/photo-1560703650-ef3e0f254ae0?w=800&q=80",
    lab: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80",
    spider_web: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
    newspaper: "https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=800&q=80",
    school: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    explosion: "https://images.unsplash.com/photo-1486848538113-ce1a4923fbc5?w=800&q=80",
    rain_city: "https://images.unsplash.com/photo-1428592953211-077101b2021b?w=800&q=80",
    sunset_city: "https://images.unsplash.com/photo-1470219556762-1fd5b5f14b3f?w=800&q=80",
    dark_figure: "https://images.unsplash.com/photo-1509822929063-6b6cfc9b42f2?w=800&q=80",
};

export const SPREADS: Spread[] = [
    // Spread 1: Origin — The Bite
    {
        leftPanels: [
            {
                src: IMG.school,
                narration: "Midtown High School, Queens...",
                caption: "Peter Parker — brilliant, awkward, invisible to everyone who mattered.",
            },
            {
                src: IMG.lab,
                caption: "The Oscorp field trip changed everything.",
            },
            {
                src: IMG.spider_web,
                narration: "One bite. One moment.",
                caption: "A genetically enhanced spider sank its fangs into Peter's hand.",
            },
            {
                src: IMG.nyc_street,
                caption: "He stumbled home through Queens, his senses on fire.",
            },
        ],
        rightPanels: [
            {
                src: IMG.skyscraper_lookup,
                narration: "The next morning...",
                caption: "The world looked different. Every sound, every movement — amplified.",
            },
            {
                src: IMG.rooftop,
                caption: "He could climb. He could leap. He could do the impossible.",
            },
            {
                src: IMG.nyc_alley,
                caption: "\"With great power...\" Uncle Ben's words echoed in his mind.",
            },
            {
                src: IMG.rain_city,
                caption: "But power without purpose is just chaos waiting to happen.",
            },
        ],
        leftLayout: "layout-4",
        rightLayout: "layout-4",
    },
    // Spread 2: Becoming Spider-Man
    {
        leftPanels: [
            {
                src: IMG.nyc_night,
                narration: "Night falls on New York City...",
                caption: "The city that never sleeps needed a guardian who never rests.",
            },
            {
                src: IMG.dark_figure,
                caption: "A shadow moved between the rooftops — faster than thought.",
            },
            {
                src: IMG.nyc_bridge,
                caption: "From bridge cables to fire escapes — the city became his playground.",
            },
            {
                src: IMG.times_square,
                caption: "Times Square erupted — \"Who IS that guy?!\"",
            },
        ],
        rightPanels: [
            {
                src: IMG.newspaper,
                narration: "DAILY BUGLE — EXCLUSIVE",
                caption: "\"SPIDER-MAN: HERO OR MENACE?\" — J. Jonah Jameson wasn't convinced.",
            },
            {
                src: IMG.nyc_skyline,
                caption: "But the people of New York knew the truth.",
            },
            {
                src: IMG.rooftop,
                caption: "Every night he returned to the rooftops. Watching. Waiting.",
            },
            {
                src: IMG.spider_web,
                caption: "The web held the city together — one thread at a time.",
            },
        ],
        leftLayout: "layout-4",
        rightLayout: "layout-4",
    },
    // Spread 3: The Villain Rises
    {
        leftPanels: [
            {
                src: IMG.explosion,
                narration: "Oscorp Tower — 11:47 PM",
                caption: "An explosion ripped through the top floors. Norman Osborn's experiment had gone wrong.",
            },
            {
                src: IMG.lab,
                caption: "The performance enhancers warped his mind beyond recognition.",
            },
            {
                src: IMG.dark_figure,
                narration: "The Green Goblin was born.",
                caption: "A new terror swooped over Manhattan on a glider of death.",
            },
            {
                src: IMG.rain_city,
                caption: "The city trembled. Even the brave looked away.",
            },
        ],
        rightPanels: [
            {
                src: IMG.nyc_bridge,
                narration: "The Brooklyn Bridge...",
                caption: "\"Spider-Man! Choose — the girl or the children! You can't save both!\"",
            },
            {
                src: IMG.skyscraper_lookup,
                caption: "Peter launched himself skyward. He would NOT choose.",
            },
            {
                src: IMG.nyc_night,
                caption: "Web lines split in every direction — a desperate, impossible rescue.",
            },
            {
                src: IMG.sunset_city,
                caption: "Against all odds, he saved them all. Every single one.",
            },
        ],
        leftLayout: "layout-4",
        rightLayout: "layout-4",
    },
    // Spread 4: The Hero New York Deserves
    {
        leftPanels: [
            {
                src: IMG.rooftop,
                narration: "The Final Confrontation",
                caption: "Atop Oscorp Tower, Spider-Man faced the Goblin one last time.",
            },
            {
                src: IMG.explosion,
                caption: "The battle shook the skyline. Windows shattered for blocks.",
            },
            {
                src: IMG.nyc_alley,
                caption: "Peter was beaten, bruised — but he got back up. He always gets back up.",
            },
            {
                src: IMG.spider_web,
                caption: "\"You'll never win, Parker!\" — \"Maybe not. But I'll never stop trying.\"",
            },
        ],
        rightPanels: [
            {
                src: IMG.sunset_city,
                narration: "Dawn breaks over Manhattan...",
                caption: "The Goblin fell. The city exhaled. Spider-Man stood alone on the rooftop.",
            },
            {
                src: IMG.nyc_skyline,
                caption: "New York City — battered but unbroken. Just like him.",
            },
            {
                src: IMG.newspaper,
                caption: "Even Jameson had to admit it: \"Okay, maybe he's not ALL bad.\"",
            },
            {
                src: IMG.nyc_night,
                narration: "To be continued...",
                caption: "Because there will always be another night. And Spider-Man will be there.",
            },
        ],
        leftLayout: "layout-4",
        rightLayout: "layout-4",
    },
];

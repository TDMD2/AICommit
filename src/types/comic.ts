export interface Panel {
    src: string;
    caption?: string;
    narration?: string;
}

export interface Spread {
    leftPanels: Panel[];
    rightPanels: Panel[];
    leftLayout: string;
    rightLayout: string;
}

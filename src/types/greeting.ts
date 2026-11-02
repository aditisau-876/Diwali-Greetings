
export type GreetingTemplate =
  | "royal"
  | "rangoli"
  | "midnight"
  | "minimal"
  | "festival"
  | "peacock";


export type Decoration =
  | "diya"
  | "marigold"
  | "lotus"
  | "rangoli"
  | "sparkles";

export interface GreetingData {
  recipient: string;
  sender: string;
  message: string;
  template: GreetingTemplate;
  decorations: Decoration[];
}

export const defaultGreeting: GreetingData = {
  recipient: "Someone Special",
  sender: "Your Name",

  message:
    "May this Diwali bring endless happiness, prosperity, love and light into your life. Wishing you and your family a beautiful festival of lights!",

  template: "royal",

  decorations: [
    "diya",
    "marigold",
    "rangoli",
    "sparkles",
  ],
};

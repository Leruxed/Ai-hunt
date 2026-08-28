import { TextStyle } from "react-native";

export const typography = {
  // Title & Headings
  h1: {
    fontSize: 24,
    fontWeight: "700" as TextStyle["fontWeight"],
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700" as TextStyle["fontWeight"],
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: 24,
  },
  
  // Body Text
  body: {
    fontSize: 14,
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: 20,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: "500" as TextStyle["fontWeight"],
    lineHeight: 20,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: 20,
  },
  
  // Subtitles & Secondary
  subtitle: {
    fontSize: 13,
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: 18,
  },
  muted: {
    fontSize: 12,
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: 16,
  },
  
  // Micro / Badges / Tags
  tag: {
    fontSize: 10.5,
    fontWeight: "500" as TextStyle["fontWeight"],
    letterSpacing: 0.2,
  },
  categoryHeader: {
    fontSize: 11,
    fontWeight: "700" as TextStyle["fontWeight"],
    letterSpacing: 0.8,
  },
  stepperLabel: {
    fontSize: 9,
    fontWeight: "600" as TextStyle["fontWeight"],
  },
};

/** Rich copy for categories index — frontend-only demo content */
export const categoryDetails: Record<
  string,
  { tagline: string; description: string; highlights: string[]; startingFrom: number }
> = {
  Audio: {
    tagline: "Immersive sound, studio clarity",
    description:
      "Headphones, speakers, and microphones tuned for music, gaming, and calls — with AI noise handling and spatial audio where it matters.",
    highlights: ["ANC & transparency modes", "Low-latency gaming audio", "Premium drivers & codecs"],
    startingFrom: 79,
  },
  Gaming: {
    tagline: "Precision gear for competitive play",
    description:
      "Peripherals built for speed and reliability: mechanical keyboards, high-DPI mice, and accessories that keep up with marathon sessions.",
    highlights: ["Hot-swap & RGB options", "High polling rates", "Comfort-first ergonomics"],
    startingFrom: 49,
  },
  Wearables: {
    tagline: "Health & focus on your wrist",
    description:
      "Smartwatches and bands that track recovery, sleep, and workouts — with coaching insights you can act on every day.",
    highlights: ["AMOLED displays", "Multi-day battery", "Advanced health sensors"],
    startingFrom: 149,
  },
  "Smart Home": {
    tagline: "One hub, every room",
    description:
      "Control lighting, climate, and security from a single intelligent layer — Matter-ready where possible for long-term compatibility.",
    highlights: ["Voice + app control", "Automation scenes", "Energy-aware routines"],
    startingFrom: 39,
  },
  Laptops: {
    tagline: "Power that travels light",
    description:
      "Ultraportables and creator laptops with fast storage, bright displays, and AI-assisted workflows for work and play.",
    highlights: ["OLED & high refresh", "All-day battery targets", "Fast charging"],
    startingFrom: 899,
  },
  Accessories: {
    tagline: "The finishing touches",
    description:
      "Mice, docks, cables, and desk essentials — the small upgrades that make daily computing feel effortless.",
    highlights: ["USB-C everywhere", "Minimal desk footprint", "Durable builds"],
    startingFrom: 19,
  },
};

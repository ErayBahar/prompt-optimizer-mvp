// Service for fetching static content (About Us, How It Works, etc.)

export interface AboutUsContent {
  introduction: string[];
  howItWorks: string[];
  whyTokenSaving: {
    description: string[];
    benefits: string[];
  };
  keyFeatures: Array<{ title: string; description: string }>;
  trustAndReliability: string[];
}

// Fallback content in case API fails
const FALLBACK_CONTENT: AboutUsContent = {
  introduction: [
    "Prompt Optimizer is a web-based application designed to help users create clearer, more effective, and reusable prompts for Large Language Models (LLMs).",
    "By analyzing and refining user-written prompts, the platform improves prompt structure while tracking key performance metrics such as token usage, latency, and optimization scores. Users can select different LLM types, review their prompt history, and provide feedback to continuously improve the optimization experience.",
    "Our mission is to simplify prompt engineering and make interactions with LLMs more efficient, measurable, and user-friendly."
  ],
  howItWorks: [
    "Start optimizing immediately – up to 5 prompt optimizations are available without signing in.",
    "Sign in to unlock full access and save your optimized prompts.",
    "Enter or paste your prompt into the editor.",
    "Optionally select an LLM type and adjust optimization parameters.",
    "Click Optimize to generate an improved version of your prompt.",
    "Compare before-and-after token usage and optimization metrics.",
    "Optimized prompts are saved automatically – mark favorites with the heart icon or delete them using the trash icon.",
    "Share your feedback to help us improve the system."
  ],
  whyTokenSaving: {
    description: [
      "Tokens are the basic units Large Language Models use to process text. Every word, symbol, or space in a prompt consumes tokens, and most LLMs apply usage limits and pricing based on token count.",
      "Reducing token usage helps you:"
    ],
    benefits: [
      "Lower costs when using paid LLM APIs",
      "Get faster responses, as shorter prompts are processed more quickly",
      "Stay within model limits and avoid errors caused by long inputs",
      "Create clearer, more focused prompts that improve output quality",
      "By removing unnecessary or repetitive text, token optimization ensures more efficient and predictable LLM interactions without sacrificing intent or clarity."
    ]
  },
  keyFeatures: [
    { title: "Prompt Optimization", description: "Generate clearer and more effective prompts" },
    { title: "Token Comparison", description: "View before-and-after token usage" },
    { title: "LLM Selection", description: "Choose the model that best fits your needs" },
    { title: "Prompt History", description: "Automatically saved optimization results" },
    { title: "Favorites & Deletion", description: "Keep what matters, remove what doesn't" },
    { title: "Feedback System", description: "Help improve optimization quality over time" }
  ],
  trustAndReliability: [
    "Asynchronous backend for fast responses",
    "Safe handling of API timeouts",
    "No data loss in saved prompts",
    "Clear and informative error messages"
  ]
};

/**
 * Fetches About Us content from API or returns fallback
 * @returns Promise<AboutUsContent>
 */
export async function fetchAboutUsContent(): Promise<AboutUsContent> {
  try {
    // In a real implementation, this would fetch from an API
    // const response = await fetch('/api/content/about-us');
    // if (!response.ok) throw new Error('Failed to fetch content');
    // return await response.json();
    
    // For now, simulate API call with slight delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return fallback content (in production, this would be the API response)
    return FALLBACK_CONTENT;
  } catch (error) {
    console.warn('Failed to fetch About Us content, using fallback:', error);
    // Return fallback content on error
    return FALLBACK_CONTENT;
  }
}

/**
 * Gets content synchronously (returns fallback immediately)
 * Use this if you need immediate content without async
 */
export function getFallbackContent(): AboutUsContent {
  return FALLBACK_CONTENT;
}

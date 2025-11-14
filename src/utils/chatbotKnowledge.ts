// Chatbot Knowledge Base - Website content and information for training
export interface KnowledgeItem {
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export const knowledgeBase: KnowledgeItem[] = [
  // About GaavConnect
  {
    category: "about",
    question: "What is GaavConnect?",
    answer: "GaavConnect is an AI-powered route optimization platform that helps you plan intelligent routes through multiple destinations. It uses advanced algorithms like Genetic Algorithm TSP Solver to find the shortest and most cost-effective paths.",
    keywords: ["gaavconnect", "about", "what is", "platform", "route optimization"]
  },
  {
    category: "about",
    question: "What makes GaavConnect special?",
    answer: "GaavConnect stands out with its AI-powered optimization using Genetic Algorithms, real-time GPS data, multiple algorithm comparison (Greedy, Nearest Neighbor, Genetic), and comprehensive multi-modal transport support.",
    keywords: ["special", "unique", "features", "ai", "genetic algorithm"]
  },

  // Features
  {
    category: "features",
    question: "What are the main features of GaavConnect?",
    answer: "Key features include: AI Route Optimization with Genetic Algorithm, Multi-destination support, Real-time location detection, Interactive map visualization, Route comparison, Export & sharing options, Crowd reporting system, and Offline support.",
    keywords: ["features", "main features", "capabilities", "what can"]
  },
  {
    category: "features",
    question: "How does the AI route optimization work?",
    answer: "Our AI uses a Genetic Algorithm to solve the Traveling Salesman Problem (TSP). It creates multiple route populations, evolves them through crossover and mutation, and selects the best routes based on distance, time, and cost optimization. The algorithm adapts its parameters based on the number of destinations.",
    keywords: ["ai", "optimization", "genetic algorithm", "tsp", "how does", "work"]
  },
  {
    category: "features",
    question: "What algorithms does GaavConnect use?",
    answer: "GaavConnect uses three algorithms: 1) Greedy Algorithm (follows your input order), 2) Nearest Neighbor (visits closest unvisited locations), and 3) Genetic Algorithm (AI-optimized for shortest overall path). This allows you to compare and choose the best route.",
    keywords: ["algorithms", "greedy", "nearest neighbor", "genetic", "comparison"]
  },

  // Getting Started
  {
    category: "getting-started",
    question: "How do I start using GaavConnect?",
    answer: "Getting started is easy: 1) Set your starting point (auto-detected or manual entry), 2) Add multiple destinations using the search box, 3) Click 'Generate AI Optimized Routes' to see options, 4) Compare and select the best route for your needs.",
    keywords: ["start", "getting started", "how to use", "begin", "tutorial"]
  },
  {
    category: "getting-started",
    question: "How do I add multiple destinations?",
    answer: "To add destinations: 1) Use the destination search box to type location names, 2) Select from the autocomplete suggestions, 3) Click the '+' button to add each destination, 4) Repeat for all your stops. You can see all added destinations in the list below.",
    keywords: ["add destinations", "multiple stops", "how to add", "destinations"]
  },
  {
    category: "getting-started",
    question: "Can I use my current location?",
    answer: "Yes! GaavConnect automatically detects your current location using GPS when you open the app. You can also manually enter your starting point if auto-detection fails or if you want to plan from a different location.",
    keywords: ["current location", "gps", "auto-detect", "location detection"]
  },

  // Transport & Pricing
  {
    category: "transport",
    question: "What transport modes are supported?",
    answer: "GaavConnect supports multiple transport modes: Walking (4 km/h, ₹0/km), Bike (15 km/h, ₹5/km + ₹10 base), Auto (35 km/h, ₹8/km + ₹20 base), and Bus (30 km/h, ₹3/km + ₹15 base). Each mode has different speeds, costs, and reliability scores.",
    keywords: ["transport", "modes", "walk", "bike", "auto", "bus", "pricing", "cost"]
  },
  {
    category: "transport",
    question: "How are costs calculated?",
    answer: "Costs are calculated based on distance and transport mode: Walking is free, Bike costs ₹5/km + ₹10 base fare, Auto costs ₹8/km + ₹20 base fare, and Bus costs ₹3/km + ₹15 base fare. The system shows total estimated costs for your entire route.",
    keywords: ["cost", "pricing", "fare", "calculate", "price", "money"]
  },

  // Technical
  {
    category: "technical",
    question: "How accurate are the distance calculations?",
    answer: "GaavConnect uses the Haversine formula for highly accurate distance calculations based on real GPS coordinates. We also integrate real-time data and validate all coordinates to ensure precision. The system provides distances accurate to within meters.",
    keywords: ["accuracy", "distance", "calculation", "haversine", "gps", "precise"]
  },
  {
    category: "technical",
    question: "Does GaavConnect work offline?",
    answer: "Yes! GaavConnect has offline support through service workers. It caches static assets, uses network-first strategy for API calls, stores data in IndexedDB, and automatically syncs when you're back online. You can plan routes even without internet.",
    keywords: ["offline", "service worker", "cache", "no internet", "sync"]
  },
  {
    category: "technical",
    question: "What technology stack is used?",
    answer: "GaavConnect is built with React 18+ and TypeScript, uses Vite for building, Tailwind CSS for styling, Radix UI components, Supabase for database and auth, Google Maps API for mapping, and includes PWA capabilities.",
    keywords: ["technology", "tech stack", "react", "typescript", "built with"]
  },

  // Maps & Routes
  {
    category: "maps",
    question: "How do I view my route on the map?",
    answer: "Your route is automatically displayed on the interactive map as you add destinations. After generating optimized routes, you can see the complete path with markers for each stop, distance information, and the optimal route highlighted in purple.",
    keywords: ["map", "view route", "visualization", "markers", "display"]
  },
  {
    category: "maps",
    question: "Can I export or share my routes?",
    answer: "Yes! You can export routes in multiple ways: copy route details to clipboard, download as text file, share via your device's share menu, or open directly in Google Maps for turn-by-turn navigation.",
    keywords: ["export", "share", "download", "google maps", "navigation"]
  },

  // Troubleshooting
  {
    category: "troubleshooting",
    question: "What if location detection fails?",
    answer: "If GPS location detection fails, you can manually enter your starting location in the search box. Make sure location services are enabled in your browser and device. The system will show specific error messages to help troubleshoot location issues.",
    keywords: ["location fails", "gps error", "troubleshoot", "manual entry", "location services"]
  },
  {
    category: "troubleshooting",
    question: "Why are my routes not saving?",
    answer: "Routes might not save if you're not logged in, there's a network issue, or database permissions aren't set correctly. Make sure you're authenticated, check your internet connection, and try refreshing the page if the issue persists.",
    keywords: ["routes not saving", "save failed", "login", "authentication", "database"]
  },
  {
    category: "troubleshooting",
    question: "Maps are not loading, what should I do?",
    answer: "If maps don't load, check that: 1) Your internet connection is stable, 2) Location permissions are granted, 3) JavaScript is enabled, 4) Try refreshing the page. The system will show error messages if there are specific issues with the mapping service.",
    keywords: ["maps not loading", "map error", "javascript", "permissions", "refresh"]
  },

  // Account & Data
  {
    category: "account",
    question: "Do I need to create an account?",
    answer: "Yes, you need to create an account to save routes, access route history, and use the crowd reporting features. Account creation is free and only requires an email and password. You can still use basic route planning without an account.",
    keywords: ["account", "signup", "registration", "login", "create account"]
  },
  {
    category: "account",
    question: "Is my data secure?",
    answer: "Yes, your data is secure. We use Supabase for authentication and data storage with Row Level Security (RLS) policies. Your routes and personal information are only accessible to you, and we follow industry-standard security practices.",
    keywords: ["security", "data safe", "privacy", "secure", "protection"]
  },

  // Crowd Reporting
  {
    category: "crowd-reporting",
    question: "What is crowd reporting?",
    answer: "Crowd reporting allows users to report crowd levels at different locations in real-time. You can report low, medium, or high crowd density, add descriptions, and help other users make informed travel decisions. Reports expire after 4 hours to keep data current.",
    keywords: ["crowd reporting", "crowd levels", "report crowd", "community", "real-time"]
  },
  {
    category: "crowd-reporting",
    question: "How do I report crowd levels?",
    answer: "To report crowd levels: 1) Go to the Crowd Report section, 2) Select your location or use current location, 3) Choose crowd severity (low/medium/high), 4) Add estimated crowd count and description, 5) Submit the report. Other users can upvote your reports.",
    keywords: ["report crowd", "how to report", "crowd levels", "submit report"]
  },

  // Performance
  {
    category: "performance",
    question: "How fast is the route optimization?",
    answer: "Route optimization is very fast: TSP Solver takes ~100-200ms for 10 stops, route loading is under 500ms with database, and the service worker ensures zero startup delay. The system is optimized for performance with a bundle size of ~850KB gzipped.",
    keywords: ["speed", "performance", "fast", "optimization time", "loading"]
  },

  // General Help
  {
    category: "help",
    question: "Where can I get more help?",
    answer: "For additional help: 1) Check the Help & Guide section for detailed FAQs, 2) Use this chatbot for quick questions, 3) Contact our support team through the 'Contact Support' button, 4) Report issues using the 'Report Issue' option in the help section.",
    keywords: ["help", "support", "contact", "assistance", "more help"]
  },
  {
    category: "help",
    question: "How do I contact support?",
    answer: "You can contact our support team via email at chotubhai0944@gmail.com. We typically respond within 24 hours. You can also use the 'Email Support' button in the Help section to send us a message directly.",
    keywords: ["contact support", "support team", "help desk", "assistance", "email", "chotubhai0944@gmail.com"]
  }
];

// Function to search knowledge base
export function searchKnowledge(query: string): KnowledgeItem[] {
  const searchTerms = query.toLowerCase().split(' ');
  const results: Array<{item: KnowledgeItem, score: number}> = [];

  knowledgeBase.forEach(item => {
    let score = 0;
    
    // Check question match
    const questionWords = item.question.toLowerCase().split(' ');
    searchTerms.forEach(term => {
      if (item.question.toLowerCase().includes(term)) {
        score += 3;
      }
      questionWords.forEach(word => {
        if (word.includes(term) || term.includes(word)) {
          score += 1;
        }
      });
    });

    // Check keywords match
    item.keywords.forEach(keyword => {
      searchTerms.forEach(term => {
        if (keyword.includes(term) || term.includes(keyword)) {
          score += 2;
        }
      });
    });

    // Check answer match (lower weight)
    searchTerms.forEach(term => {
      if (item.answer.toLowerCase().includes(term)) {
        score += 1;
      }
    });

    if (score > 0) {
      results.push({ item, score });
    }
  });

  // Sort by score and return top results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(result => result.item);
}

// Function to get random helpful suggestions
export function getRandomSuggestions(count: number = 3): string[] {
  const suggestions = [
    "How does the AI route optimization work?",
    "How do I add multiple destinations?",
    "What transport modes are supported?",
    "Can I use my current location?",
    "How accurate are the distance calculations?",
    "What is crowd reporting?",
    "How do I export my routes?",
    "Does GaavConnect work offline?",
    "What algorithms does GaavConnect use?",
    "How are costs calculated?"
  ];

  const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  HelpCircle, 
  MapPin, 
  Route, 
  Sparkles, 
  Navigation, 
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Brain,
  MessageCircle
} from 'lucide-react';
import { Chatbot } from './Chatbot';

interface FAQItem {
  question: string;
  answer: string;
  category: 'getting-started' | 'optimization' | 'features' | 'troubleshooting';
}

const faqData: FAQItem[] = [
  {
    question: "How does the AI route optimization work?",
    answer: "Our AI uses a Genetic Algorithm to solve the Traveling Salesman Problem (TSP). It creates multiple route populations, evolves them through crossover and mutation, and selects the best routes based on distance, time, and cost optimization. The algorithm adapts its parameters based on the number of destinations for optimal performance.",
    category: "optimization"
  },
  {
    question: "What makes this different from regular GPS navigation?",
    answer: "Unlike standard GPS that finds routes between two points, our system optimizes routes through multiple destinations simultaneously. It compares different algorithms (Greedy, Nearest Neighbor, and Genetic Algorithm) to find the most efficient path visiting all your stops.",
    category: "optimization"
  },
  {
    question: "How do I add multiple destinations?",
    answer: "1. Enter your starting point or use auto-detect location\n2. Add destinations one by one using the search box\n3. Click 'Generate AI Optimized Routes' to see multiple route options\n4. Compare and select the best route for your needs",
    category: "getting-started"
  },
  {
    question: "What data is used for real-time calculations?",
    answer: "We use live GPS coordinates, real-time reverse geocoding via OpenStreetMap, and high-precision distance calculations. No mock data is involved - all distances, times, and costs are calculated using current location data.",
    category: "features"
  },
  {
    question: "Why do I see multiple route options?",
    answer: "We generate 3 different routes using different algorithms:\n• Greedy: Your original input order\n• Nearest Neighbor: Visits closest unvisited locations\n• Genetic Algorithm: AI-optimized for shortest overall path\nThis lets you choose based on your preferences for time, distance, or cost.",
    category: "optimization"
  },
  {
    question: "How accurate are the cost estimates?",
    answer: "Cost estimates are based on distance and transport mode (walk, bike, auto, bus) with standard fare calculations. Actual costs may vary based on local pricing, traffic conditions, and specific service providers.",
    category: "features"
  },
  {
    question: "What if location detection fails?",
    answer: "If GPS fails, you can manually enter your starting location. The system has multiple fallback mechanisms and will show specific error messages to help you troubleshoot location issues.",
    category: "troubleshooting"
  },
  {
    question: "Can I export or share my optimized routes?",
    answer: "Yes! You can copy route details to clipboard, download as text file, share via your device's share menu, or open directly in Google Maps for navigation.",
    category: "features"
  }
];

export function HelpGuide() {
  const [activeCategory, setActiveCategory] = useState<string>('getting-started');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: Navigation },
    { id: 'optimization', label: 'AI Optimization', icon: Brain },
    { id: 'features', label: 'Features', icon: Sparkles },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: HelpCircle }
  ];

  const filteredFAQs = faqData.filter(faq => faq.category === activeCategory);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <HelpCircle className="w-8 h-8 text-[#6A0DAD]" />
          <h1 className="text-3xl font-bold text-[#6A0DAD]">Help & Guide</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Learn how to use GaavConnect's AI-powered route optimization to plan your perfect journey
        </p>
        
        {/* AI Assistant Button */}
        <div className="mt-6">
          <Button
            onClick={() => setIsChatbotOpen(true)}
            className="bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white shadow-lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Ask AI Assistant
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Get instant answers about features, troubleshooting, and more
          </p>
        </div>
      </div>

      {/* Quick Start Guide */}
      <Card className="p-6 mb-8 border-[#E6E6FA] bg-gradient-to-r from-purple-50 to-blue-50">
        <h2 className="text-xl font-semibold text-[#6A0DAD] mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Start Guide
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-[#6A0DAD] rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">1. Set Origin</h3>
            <p className="text-sm text-gray-600">Auto-detect or manually enter your starting point</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-[#8B2DC2] rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">2. Add Stops</h3>
            <p className="text-sm text-gray-600">Search and add multiple destinations</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-[#6A0DAD] rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">3. AI Optimize</h3>
            <p className="text-sm text-gray-600">Generate multiple optimized route options</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-[#8B2DC2] rounded-full flex items-center justify-center mx-auto mb-3">
              <Route className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">4. Choose Route</h3>
            <p className="text-sm text-gray-600">Compare and select the best option</p>
          </div>
        </div>
      </Card>

      {/* Algorithm Comparison */}
      <Card className="p-6 mb-8 border-[#E6E6FA]">
        <h2 className="text-xl font-semibold text-[#6A0DAD] mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Optimization Algorithms
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-blue-100 text-blue-700">Greedy</Badge>
              <span className="text-sm text-gray-600">Original Order</span>
            </div>
            <p className="text-sm text-gray-700">
              Follows your input sequence. Fast and straightforward, good for when order matters.
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-green-100 text-green-700">Nearest Neighbor</Badge>
              <span className="text-sm text-gray-600">Local Optimization</span>
            </div>
            <p className="text-sm text-gray-700">
              Visits closest unvisited locations. Good balance of speed and optimization.
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-purple-100 text-purple-700">Genetic Algorithm</Badge>
              <span className="text-sm text-gray-600">AI Optimized</span>
            </div>
            <p className="text-sm text-gray-700">
              Advanced AI optimization for shortest overall path. Best for complex multi-stop routes.
            </p>
          </div>
        </div>
      </Card>

      {/* FAQ Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              variant={activeCategory === category.id ? "default" : "outline"}
              className={`flex items-center gap-2 ${
                activeCategory === category.id 
                  ? 'bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white' 
                  : 'border-[#E6E6FA] text-[#6A0DAD] hover:bg-purple-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="space-y-4">
        {filteredFAQs.map((faq, index) => (
          <Card key={index} className="border-[#E6E6FA]">
            <Button
              onClick={() => toggleFAQ(index)}
              variant="ghost"
              className="w-full p-6 text-left justify-between hover:bg-purple-50"
            >
              <span className="font-medium text-gray-800">{faq.question}</span>
              {expandedFAQ === index ? (
                <ChevronUp className="w-5 h-5 text-[#6A0DAD]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#6A0DAD]" />
              )}
            </Button>
            {expandedFAQ === index && (
              <div className="px-6 pb-6">
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Contact Support */}
      <Card className="p-6 mt-8 border-[#E6E6FA] bg-gradient-to-r from-purple-50 to-blue-50 text-center">
        <h3 className="text-lg font-semibold text-[#6A0DAD] mb-2">Still Need Help?</h3>
        <p className="text-gray-600 mb-4">
          Can't find what you're looking for? Our support team is here to help!
        </p>
        
        {/* Contact Details */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-[#E6E6FA]">
          <h4 className="font-semibold text-[#6A0DAD] mb-3">Contact Details</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#6A0DAD]" />
              <span className="text-gray-700">Email Support:</span>
              <a 
                href="mailto:chotubhai0944@gmail.com" 
                className="text-[#6A0DAD] hover:text-[#8B2DC2] font-medium underline"
              >
                chotubhai0944@gmail.com
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              📧 We typically respond within 24 hours
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center">
          <Button 
            onClick={() => window.open('mailto:chotubhai0944@gmail.com?subject=GaavConnect Support Request', '_blank')}
            className="bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Email Support
          </Button>
        </div>
      </Card>

      {/* Chatbot Integration */}
      <Chatbot 
        isOpen={isChatbotOpen} 
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)} 
      />
    </div>
  );
}

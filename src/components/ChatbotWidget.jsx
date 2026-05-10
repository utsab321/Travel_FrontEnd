import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthRequired } from "../hooks/useAuthRequired";
import api from "../API/api";
import { Send as SendIcon } from "@mui/icons-material";
import ChatIcon from "@mui/icons-material/Chat";
import { Close as CloseIcon } from "@mui/icons-material";
import { apiFetch, getToken } from "../utils/api";
import { findNavigationRoute, parseNavigationFromMessage } from "../utils/navigationHelper";

// User FAQs
const USER_FAQS = [
  {
    id: 1,
    keywords: ["signup", "create account", "register", "new account", "get started", "sign up", "registration"],
    question: "How do I create an account and get started?",
    answer: "Welcome! Getting started is easy:\n\n1. Click on the **Sign Up** button on the login page\n2. Enter your first name, last name, date of birth, and gender\n3. Provide your contact details (email, phone number, address, city, country, and postal code)\n4. Create a secure password (at least 6 characters)\n5. Answer security questions for account recovery\n6. Click **Complete Registration** and you're done!\n\nWe recommend using a valid email address and phone number so you can stay connected with travel partners."
  },
  {
    id: 2,
    keywords: ["kyc", "know your customer", "verify", "verification", "identity", "passport", "id"],
    question: "What is KYC and why do I need to complete it?",
    answer: "KYC stands for **Know Your Customer**. It's our way of keeping the Travel Companion community safe and verified.\n\nTo complete KYC verification:\n1. Navigate to the **KYC** section from your dashboard\n2. Provide your citizenship information\n3. Upload a clear photo of your passport or government-issued ID\n4. Enter your passport/ID number and expiry date (must be valid for at least 6 more months)\n\nOnce submitted, our team will review within 24-48 hours. Until then, you can still browse and create trips, but some features may be limited. This keeps partners confident they're connecting with real, verified individuals."
  },
  {
    id: 3,
    keywords: ["create trip", "new trip", "start trip", "plan trip", "trip creation"],
    question: "How do I create a trip?",
    answer: "Creating a trip is simple:\n\n1. Go to your **Dashboard** and click the **Create Trip** button\n2. Enter your trip details:\n   - **Trip Title** (e.g., \"Nepal Adventure 2025\")\n   - **Destination** (select from our list)\n   - **Start & End Dates**\n   - **Description** (tell others what you're planning)\n3. Select your **Travel Preferences**:\n   - Pace: Relaxed, Moderate, or Fast-paced\n   - Budget: Budget, Mid-range, or Luxury\n   - Accommodation: Hostel, Hotel, Inn, or Camping\n4. Add any **Constraints/Tags**\n5. Choose if your trip is **Public** or **Private**\n6. Click **Create Trip**!\n\nAfter creating, share your trip or invite specific travelers."
  },
  {
    id: 4,
    keywords: ["find partners", "travel partners", "matching", "match", "compatible", "find people", "connect"],
    question: "How do I find travel partners who match my style?",
    answer: "Travel Companion uses intelligent matching to connect you with compatible travelers:\n\n1. After creating your trip, browse the **Explore** section to see similar trips\n2. Use **search & filter** options to find travelers with matching:\n   - Destination and dates\n   - Travel pace and budget\n   - Accommodation preferences\n   - Interests and constraints\n3. Visit their **public profile** to see travel history and preferences\n4. Once you find someone, you can:\n   - Send them a **message**\n   - Request to join their trip\n   - Invite them to yours\n\n**Tip:** Complete your profile fully and set preferences to get better matches!"
  },
  {
    id: 5,
    keywords: ["search destinations", "explore", "destination", "find destination", "browse destinations", "cities"],
    question: "How do I search for destinations?",
    answer: "Discovering your next adventure is easy:\n\n1. From the **Home** page, use the **search bar** to look for cities\n2. Browse the **destination gallery** to explore popular locations like Kathmandu, Pokhara, Mustang, and more\n3. Click on any destination to see:\n   - Stunning photos and descriptions\n   - Popular trips to that location\n   - Other travelers planning trips there\n   - Average travel pace and budget\n4. **Create your own trip** or **join an existing one**\n\nDon't worry if you're unsure—check out trending destinations on your dashboard for inspiration!"
  },
  {
    id: 6,
    keywords: ["chat", "message", "text", "communicate", "messaging", "conversation"],
    question: "How does the chat system work?",
    answer: "The chat feature lets you easily communicate with other travelers:\n\n1. Go to the **Chat** section from navigation\n2. You'll see a list of your **active conversations** on the left\n3. Click on any conversation to open the **message thread**\n4. Type your message and click **Send**\n5. Messages appear instantly—blue bubbles are yours, gray are theirs\n\n**Quick Tips:**\n- Chats only work between users who've connected\n- Keep conversations respectful and trip-focused\n- Share plans and coordinate details with partners\n- Report or block anyone being disrespectful"
  },
  {
    id: 7,
    keywords: ["profile", "setup profile", "edit profile", "preferences", "travel style", "travel pace", "accommodation"],
    question: "How do I set up my profile and travel preferences?",
    answer: "Your profile is your travel personality card!\n\nTo set it up:\n1. Go to **Profile** from navigation\n2. Update your information:\n   - **Profile photo** (helps travelers recognize you)\n   - **Bio** (tell about yourself in 100-500 words)\n   - **Travel Style**: Budget, Luxury, or Adventure\n   - **Pace Preference**: Relaxed, Moderate, or Fast-paced\n   - **Accommodation**: Hostel, Hotel, Inn, or Camping\n3. Add **travel constraints** (dietary restrictions, interests, etc.)\n4. Save your changes\n\nThe more complete your profile, the better matches you'll get!"
  },
  {
    id: 8,
    keywords: ["forgot password", "reset password", "password recovery", "can't login", "password reset"],
    question: "I forgot my password. How do I reset it?",
    answer: "No worries—password recovery is straightforward:\n\n1. On the **Login** page, click **Forgot Password?**\n2. Enter your **username** or **email**\n3. Answer one of your **security questions** (from registration)\n4. Once verified, **create a new password**\n5. Use this new password to log back in\n\n**Tip:** If you can't remember your security answers, our support team can verify your identity using your phone number or email."
  },
  {
    id: 9,
    keywords: ["safe", "safety", "security", "privacy", "data privacy", "personal information", "secure", "protect"],
    question: "Is my personal information safe on Travel Companion?",
    answer: "Yes! We take your safety and privacy seriously:\n\n- **KYC Verification** ensures all members are real and verified\n- Your **ID/passport documents** are encrypted—only admins see them for verification\n- **Chat messages** are private between you and the other person\n- **Phone number and email** only shown to people you've connected with\n- You control your **trip visibility** (public or private)\n- You can **block or report** inappropriate users\n- We have **24/7 support** to help if something feels off\n\nNever share financial information or meet without telling someone where you'll be. Trust your instincts!"
  },
  {
    id: 10,
    keywords: ["private trip", "private", "invite only", "visibility"],
    question: "Can I make my trip private so only invited people can see it?",
    answer: "Absolutely! You have full control over trip visibility:\n\n1. When **creating a trip**, toggle **Private** to keep it invite-only\n2. In **trip settings**, add specific people by their username\n3. Only invited people can see details and request to join\n4. Change a trip from **public to private** (or vice versa) anytime\n\nThis is perfect for planning a specific group trip or inviting friends directly rather than opening it to the community!"
  },
  {
    id: 11,
    keywords: ["tags", "constraints", "interests", "travel interests", "dietary"],
    question: "What are trip tags and constraints, and why should I set them?",
    answer: "Trip tags help other travelers understand what your trip is about:\n\n- **Travel Interests**: hiking, food tours, cultural sites, nightlife, budget backpacking, etc.\n- **Constraints**: vegetarian-friendly, no party scene, wheelchair accessible, pet-friendly, LGBTQ+ friendly, etc.\n\n**Why set them?**\n- Helps the platform match you with compatible travelers\n- Prevents mismatches (e.g., hikers won't join relaxation trips)\n- Makes your trip more discoverable to people with shared values\n\nWhen browsing trips, filter by tags to find ones aligned with your interests!"
  },
  {
    id: 12,
    keywords: ["after create trip", "itinerary", "trip planner", "plan itinerary", "add itinerary"],
    question: "What happens after I create a trip? How do I plan an itinerary?",
    answer: "Creating a trip is just the beginning!\n\nHere's what comes next:\n1. **Share your trip** with the community or invite specific people\n2. **Use the Trip Planner** to build a detailed itinerary:\n   - Break down your trip day-by-day\n   - Plan activities, meals, and accommodation\n   - Share with travel partners\n3. **Chat with interested travelers** who want to join\n4. **Review and approve requests** from people wanting to join\n5. Once partners are confirmed, **coordinate final details**\n6. As the trip date approaches, **update the itinerary** if plans change\n\nThe Trip Planner is collaborative—partners can suggest ideas together!"
  },
  {
    id: 13,
    keywords: ["kyc banner", "kyc notification", "kyc pending", "complete kyc", "why kyc banner"],
    question: "Why am I seeing a KYC banner on my dashboard, and what should I do?",
    answer: "The KYC banner appears because your identity verification is pending or incomplete.\n\n**Why it matters:**\n- KYC verification protects you and other travelers\n- Without it, some features may be limited\n- It only takes 10-15 minutes to complete\n\n**To complete KYC:**\n1. Click **Complete KYC** on the banner\n2. Upload a clear photo of your passport/government ID\n3. Provide your ID number and expiry date\n4. Our team reviews within 24-48 hours\n5. You'll get approved and the banner disappears!\n\nIt's a one-time process and keeps everyone safer."
  },
  {
    id: 14,
    keywords: ["mobile", "phone", "responsive", "app on phone", "mobile friendly", "works on phone"],
    question: "The app looks different on my phone. Is it mobile-friendly?",
    answer: "Yes! Travel Companion works smoothly on both desktop and mobile:\n\n- **Mobile Version**: All key features work great on smartphones\n- **Responsive Design**: Forms and navigation adjust to your screen\n- **Easy Navigation**: Menu works great on smaller screens\n- **Chat on Mobile**: Send/receive messages from anywhere\n\n**Tips for Mobile Use:**\n- Use the hamburger menu (☰) on smaller screens\n- Tap destination cards to see full details\n- Messages update in real-time\n- Saving your login keeps you signed in across devices\n\nIf something doesn't work smoothly, let us know!"
  },
  {
    id: 15,
    keywords: ["error", "not working", "issue", "problem", "broken", "help", "troubleshoot", "support"],
    question: "What if I encounter an error or something isn't working right?",
    answer: "We're here to help! If you run into issues:\n\n**Quick Fixes:**\n- **Page won't load?** Try refreshing (Ctrl+R or Cmd+R)\n- **Chat not sending?** Check internet and try again\n- **Profile won't save?** Make sure all required fields are filled\n- **Can't log in?** Use forgot password, or check your username\n- **Browser cache issues?** Clear cache and cookies\n\n**Still having trouble?**\n- Use the **in-app chatbot** (this chat!) for instant help\n- Contact our **support team** through the app\n- Check for **error messages** on screen—they tell you what to fix\n\nOur team usually responds within 24 hours. Thanks for your patience!"
  }
];

// Build reverse keyword index for O(1) lookups
const FAQ_KEYWORD_MAP = new Map();
USER_FAQS.forEach(faq => {
  faq.keywords.forEach(keyword => {
    FAQ_KEYWORD_MAP.set(keyword, faq);
  });
});

// Text parsing helper - enhanced to handle markdown links
const parseMessageText = (text, onNavigate) => {
  if (!text) return [];
  
  // Parse both bold text and markdown links [text](path)
  const parts = [];
  const boldAndLinkRegex = /(\*\*[^*]+\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = boldAndLinkRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        type: 'text'
      });
    }

    // Check if it's a link or bold
    if (match[0].startsWith('[')) {
      // It's a link
      parts.push({
        text: match[2],
        type: 'link',
        path: match[3],
        onNavigate
      });
    } else {
      // It's bold text
      parts.push({
        text: match[1].replace(/\*\*/g, ''),
        type: 'bold'
      });
    }

    lastIndex = boldAndLinkRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      type: 'text'
    });
  }

  return parts.length > 0 ? parts : [{ text, type: 'text' }];
};



// Enhance FAQ answers with navigation suggestions
const enhanceFAQWithNavigation = (answer) => {
  // Map FAQ topics to suggested routes
  const topicNavigationMap = {
    signup: '/register',
    'create account': '/register',
    kyc: '/kyc',
    'verify': '/kyc',
    'create trip': '/create-trip',
    'new trip': '/create-trip',
    'trip planner': '/trip-planner',
    itinerary: '/trip-planner',
    explore: '/explore',
    'destinations': '/explore',
    'chat': '/chat',
    'message': '/chat',
    'profile': '/profile',
    'forgot password': '/forgot-password',
  };

  // Check if answer mentions a feature that has a corresponding route
  let enhancedAnswer = answer;
  for (const [topic, route] of Object.entries(topicNavigationMap)) {
    const regex = new RegExp(`\\*\\*${topic.split(' ').join('.*?')}\\*\\*`, 'gi');
    if (regex.test(answer)) {
      // Find the feature name mentioned
      const featureMatch = answer.match(new RegExp(`\\*\\*(${topic}[^*]*)\\*\\*`, 'i'));
      if (featureMatch) {
        const featureName = featureMatch[1];
        // Add navigation link if not already present
        if (!answer.includes(route)) {
          enhancedAnswer += `\n\n[Go to ${featureName} →](${route})`;
        }
      }
    }
  }

  return enhancedAnswer;
};

export default function ChatbotWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isReady: isAuthReady } = useAuthRequired();
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showBotAlert, setShowBotAlert] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hi! 👋 I'm here to help you get the most out of Travel Companion.\n\nI can answer questions about:\n• **Getting started** (signup, login, KYC)\n• **Creating & joining trips**\n• **Finding travel partners**\n• **Chat & messaging**\n• **Profile setup**\n• **Safety & security**\n\nJust ask me anything—I'll provide instant answers!\n\nOr ask about a specific feature you need help with.", 
      sender: "bot", 
      links: [] 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Fetch user profile for KYC status
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token || !isAuthReady) return;
      
      try {
        const data = await apiFetch("/api/users/me/");
        if (data) {
          setUserProfile(data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    if (user && isAuthReady) fetchProfile();
  }, [user, isAuthReady]);

  // Show bot alert for new users (only once)
  useEffect(() => {
    if (user && isAuthReady) {
      const alertDismissed = localStorage.getItem(`botAlertDismissed_${user.id}`);
      const isNewUser = localStorage.getItem(`isNewUser_${user.id}`);
      
      // Show alert if user just registered and hasn't dismissed it
      if (isNewUser && !alertDismissed) {
        setShowBotAlert(true);
      }
    }
  }, [user, isAuthReady]);

  const handleDismissBotAlert = () => {
    setShowBotAlert(false);
    if (user) {
      localStorage.setItem(`botAlertDismissed_${user.id}`, "true");
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!user) return null;

  // Find matching FAQ with optimized keyword lookup
  const findMatchingFAQ = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase().trim();
    const words = lowerMessage.split(/\s+/).filter(w => w.length > 2);
    
    // Check for exact keyword match first (fastest)
    for (const word of words) {
      if (FAQ_KEYWORD_MAP.has(word)) {
        return FAQ_KEYWORD_MAP.get(word);
      }
    }
    
    // Check for substring matches in remaining keywords
    for (const [keyword, faq] of FAQ_KEYWORD_MAP) {
      if (lowerMessage.includes(keyword)) {
        return faq;
      }
    }
    
    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), text: input, sender: "user", links: [] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    
    try {
      const matchingFAQ = findMatchingFAQ(input);
      
      if (matchingFAQ) {
        // Enhance FAQ answer with navigation link if relevant
        let answer = matchingFAQ.answer;
        
        // Check if user is asking for navigation help
        const navRoute = findNavigationRoute(input);
        if (navRoute && !answer.includes('→')) {
          // Add navigation link to end of answer
          const routeName = navRoute.route.name;
          answer += `\n\n[Go to ${routeName} →](${navRoute.route.path})`;
        }
        
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          text: answer,
          sender: "bot",
          links: []
        }]);
      } else {
        // Check if this is a navigation query
        const navRoute = findNavigationRoute(input);
        let response = null;

        if (navRoute) {
          // User is asking about navigation
          const routeName = navRoute.route.name;
          response = `I can help you get there! **${routeName}** is exactly what you're looking for.\n\n[Go to ${routeName} →](${navRoute.route.path})`;
        } else {
          // Fall back to API
          const res = await api.post("/api/chat/chat/", { message: input });
          response = res.data.response || "I didn't understand that. Can you rephrase? Or ask about signup, trips, partners, chat, profile, KYC, or safety!";
          
          // Enhance API response with navigation links if it mentions key features
          const topicNavigationMap = {
            'explore': '/explore',
            'map': '/explore',
            'destinations': '/explore',
            'chat': '/chat',
            'profile': '/profile',
            'create trip': '/create-trip',
            'trips': '/my-trips',
          };
          
          for (const [topic, route] of Object.entries(topicNavigationMap)) {
            if (response.toLowerCase().includes(topic) && !response.includes(`(${route})`)) {
              const topicDisplay = topic.charAt(0).toUpperCase() + topic.slice(1);
              response += `\n\n[Go to ${topicDisplay} →](${route})`;
              break;
            }
          }
        }
        
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          text: response,
          sender: "bot",
          links: []
        }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: "Sorry, I couldn't respond. Please try again!",
        sender: "bot",
        links: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes cw-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cw-dot  { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
        @keyframes slideInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .cw-dot1{animation:cw-dot 1.2s infinite .0s}
        .cw-dot2{animation:cw-dot 1.2s infinite .2s}
        .cw-dot3{animation:cw-dot 1.2s infinite .4s}
        .cw-msg {animation:cw-fade .18s ease both}
        .cw-popup-enter { animation: slideInUp 0.25s cubic-bezier(0.19, 1, 0.22, 1) }
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(240,194,122,.25);border-radius:3px}
      `}</style>

      {/* Bot Intro Popup - Intercom/Drift style */}
      {showBotAlert && (
        <div className="cw-popup-enter" style={{
          position: "fixed",
          bottom: 96,
          right: 24,
          zIndex: 9999,
          maxWidth: 320,
          width: "100%",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {/* Popup Card */}
          <div style={{
            background: "#1a1f2e",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 12,
            padding: "16px 16px 16px 16px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            position: "relative",
          }}>
            {/* Close Button */}
            <button
              onClick={handleDismissBotAlert}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                padding: 4,
                fontSize: 18,
                transition: "color .2s",
              }}
              onMouseEnter={e => e.target.style.color = "#ccc"}
              onMouseLeave={e => e.target.style.color = "#999"}
              title="Close"
            >
              ✕
            </button>

            {/* Avatar & Header */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  background: "linear-gradient(135deg,#c9973a,#f0c27a)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#0f0e0d",
                  flexShrink: 0,
                }}>
                  T
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    color: "#f5f0e8",
                    fontSize: 14,
                    lineHeight: 1.2,
                  }}>
                    Journey Guide
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                    marginTop: 2,
                  }}>
                    Usually replies instantly
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <p style={{
              margin: "0 0 12px 0",
              color: "rgba(245,240,232,0.85)",
              fontSize: 13,
              lineHeight: 1.6,
            }}>
              Ready to start your adventure? I can help you find travel partners, create trips, explore destinations, and answer any questions about the app.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => {
                setIsOpen(true);
                handleDismissBotAlert();
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "linear-gradient(135deg,#c9973a,#f0c27a)",
                border: "none",
                borderRadius: 8,
                color: "#0f0e0d",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all .2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              onMouseEnter={e => {
                e.target.style.transform = "scale(1.02)";
                e.target.style.boxShadow = "0 6px 16px rgba(240,194,122,0.35)";
              }}
              onMouseLeave={e => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "none";
              }}
            >
              Chat with me
              <span style={{ fontSize: 15 }}>→</span>
            </button>
          </div>

          {/* Arrow Tip pointing to chat button */}
          <div style={{
            position: "absolute",
            bottom: -8,
            right: 24,
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid rgba(201,168,76,0.3)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
          }}></div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        title="Chat with Travel Assistant"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%", border: "none",
          background: "linear-gradient(135deg,#c9973a,#f0c27a)",
          color: "#0f0e0d", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(240,194,122,.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform .2s, box-shadow .2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform="scale(1.08)"; e.currentTarget.style.boxShadow="0 6px 28px rgba(240,194,122,.6)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform="scale(1)";    e.currentTarget.style.boxShadow="0 4px 20px rgba(240,194,122,.45)"; }}
      >
        {isOpen ? <CloseIcon fontSize="small"/> : <ChatIcon fontSize="small"/>}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: 92, right: 24, zIndex: 9998,
          width: 320, height: 420,
          background: "#0a0b14",
          border: ".5px solid rgba(240,194,122,.18)",
          borderRadius: 16,
          boxShadow: "0 16px 48px rgba(0,0,0,.7)",
          display: "flex", flexDirection: "column",
          fontFamily: "'DM Sans', sans-serif",
          animation: "cw-fade .2s ease",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg,#c9973a,#f0c27a)",
            padding: "14px 16px", flexShrink: 0,
          }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#0f0e0d" }}>
              � Travel Assistant
            </div>
            <div style={{ fontSize: 11, color: "rgba(15,14,13,.6)", marginTop: 2 }}>
              Always here to help
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((msg) => {
              const parts = msg.sender === "bot" ? parseMessageText(msg.text, navigate) : [];
              return (
                <div key={msg.id} className="cw-msg" style={{ display: "flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "78%",
                    padding: "9px 13px",
                    borderRadius: msg.sender === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    background: msg.sender === "user"
                      ? "linear-gradient(135deg,#c9973a,#f0c27a)"
                      : "rgba(255,255,255,.06)",
                    border: msg.sender === "user"
                      ? "none"
                      : ".5px solid rgba(240,194,122,.12)",
                    color: msg.sender === "user" ? "#0f0e0d" : "rgba(245,240,232,.85)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}>
                    {msg.sender === "bot" ? (
                      <div>
                        {parts.map((part, idx) => {
                          if (part.type === 'bold') {
                            return <strong key={idx}>{part.text}</strong>;
                          } else if (part.type === 'link') {
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  navigate(part.path);
                                  setIsOpen(false); // Close chat after navigation
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'rgba(245,240,232,.95)',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  padding: 0,
                                  font: 'inherit',
                                  fontWeight: 500,
                                  transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={e => e.target.style.opacity = '0.7'}
                                onMouseLeave={e => e.target.style.opacity = '1'}
                                title={`Navigate to ${part.text}`}
                              >
                                {part.text}
                              </button>
                            );
                          } else {
                            return <span key={idx}>{part.text}</span>;
                          }
                        })}
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 14px", borderRadius: "12px 12px 12px 2px",
                  background: "rgba(255,255,255,.06)",
                  border: ".5px solid rgba(240,194,122,.12)",
                  display: "flex", gap: 5, alignItems: "center",
                }}>
                  {[0,1,2].map(i => (
                    <span key={i} className={`cw-dot${i+1}`} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#f0c27a", display: "inline-block",
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{
            borderTop: ".5px solid rgba(240,194,122,.1)",
            padding: "10px 12px",
            background: "rgba(255,255,255,.02)",
            display: "flex", flexDirection: "column", gap: 8, flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask me something…"
                style={{
                  flex: 1, padding: "9px 13px", fontSize: 13,
                  background: "rgba(255,255,255,.05)",
                  border: ".5px solid rgba(240,194,122,.15)",
                  borderRadius: 10, color: "#f5f0e8", outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color .2s"
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(240,194,122,.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(240,194,122,.15)")}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 9, border: "none",
                  background: (loading || !input.trim())
                    ? "rgba(255,255,255,.07)"
                    : "linear-gradient(135deg,#c9973a,#f0c27a)",
                  color: (loading || !input.trim()) ? "rgba(255,255,255,.2)" : "#0f0e0d",
                  cursor: (loading || !input.trim()) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .2s", flexShrink: 0,
                }}
              >
                <SendIcon sx={{ fontSize: 16 }}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
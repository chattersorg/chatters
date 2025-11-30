import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PrimaryButton from "../../common/buttons/PrimaryButton";

const Hero = ({
  eyebrow = "Will for hospo",
  title = "AI-Powered Intelligence That Transforms Feedback Into Action",
  subtitle = "Stop drowning in data. Let AI analyse thousands of customer responses instantly, identify critical trends, and deliver actionable recommendations that drive real business results.",
  primaryCta = { label: "Book a demo", to: "/demo" },
  secondaryCta = { label: "Pricing", to: "/pricing" },
  bullets = [
    "Alerts direct to staff",
    "Boost revenue & ratings",
    "Multi-location control",
    "Improve customer retention",
  ],
  backgroundGradient = "from-white via-white to-purple-50",
}) => {
  const prefersReduced = useReducedMotion();

  // --- Text animation variants ---
  const container = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReduced ? 0 : 0.4,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: prefersReduced ? 0 : 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  };

  // --- Right card animation ---
  const cardInitial = prefersReduced ? {} : { opacity: 0, x: 32 };
  const cardAnimate = prefersReduced ? {} : { opacity: 1, x: 0 };
  const cardTransition = { duration: 0.45, ease: "easeOut", delay: prefersReduced ? 0 : 0.15 };

  // --- Simulated activity ---
  const [stats, setStats] = useState({ alerts: 12, response: "3m", resolution: 84 });
  const [feedbackItems, setFeedbackItems] = useState([
    { id: 1, table: "Table 213", msg: "I'm still waiting for my food..", status: "Unresolved", isNew: false },
    { id: 2, table: "Table 33", msg: "Just needs assistance", status: "Assistance Request", isNew: false },
    { id: 3, table: "Table 801", msg: "Music is too loud!!", status: "Resolved", isNew: false },
  ]);

  const feedbackPool = [
    { table: "Table 15", msg: "Service is really slow today", status: "Unresolved" },
    { table: "Table 8", msg: "Could we get some extra napkins?", status: "Assistance Request" },
    { table: "Table 42", msg: "The food was cold when it arrived", status: "Unresolved" },
    { table: "Table 23", msg: "WiFi password isn't working", status: "Assistance Request" },
    { table: "Table 67", msg: "Table is a bit wobbly", status: "Assistance Request" },
    { table: "Table 91", msg: "Really happy with the service!", status: "Resolved" },
    { table: "Table 5", msg: "Missing cutlery at our table", status: "Unresolved" },
    { table: "Table 12", msg: "Could we get the check please?", status: "Assistance Request" },
    { table: "Table 34", msg: "The AC is too cold in here", status: "Assistance Request" },
    { table: "Table 7", msg: "Our order is missing the side dish", status: "Unresolved" },
    { table: "Table 19", msg: "Could you turn down the music please?", status: "Assistance Request" },
    { table: "Table 28", msg: "The bathroom needs attention", status: "Unresolved" },
    { table: "Table 56", msg: "We ordered medium but got well done", status: "Unresolved" },
    { table: "Table 3", msg: "Absolutely loved the dessert!", status: "Resolved" },
    { table: "Table 14", msg: "Water glasses need refilling", status: "Assistance Request" },
    { table: "Table 45", msg: "Server was incredibly helpful", status: "Resolved" },
    { table: "Table 22", msg: "Spilled drink on the floor", status: "Assistance Request" },
    { table: "Table 11", msg: "Food took over 45 minutes", status: "Unresolved" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const action = Math.random() < 0.6 ? "add" : "resolve";

      if (action === "add") {
        setFeedbackItems(prev => {
          const currentTables = prev.map(item => item.table);
          const availableFeedback = feedbackPool.filter(f => !currentTables.includes(f.table));
          if (availableFeedback.length === 0) return prev;

          const newFeedback = availableFeedback[Math.floor(Math.random() * availableFeedback.length)];
          const newItem = { id: Date.now(), ...newFeedback, isNew: true };

          setStats(prevStats => ({
            alerts: prevStats.alerts + (newFeedback.status !== "Resolved" ? 1 : 0),
            response: Math.random() < 0.5 ? "2m" : "3m",
            resolution: Math.min(99, prevStats.resolution + Math.floor(Math.random() * 3)),
          }));

          const updated = [newItem, ...prev];
          return updated.slice(0, 4);
        });

        setTimeout(() => {
          setFeedbackItems(prev => prev.map(item => ({ ...item, isNew: false })));
        }, 500);
      } else {
        setFeedbackItems(prev => {
          const unresolved = prev.filter(item => item.status === "Unresolved");
          if (unresolved.length > 0) {
            const itemToResolve = unresolved[0];
            setStats(prevStats => ({ ...prevStats, resolution: Math.min(99, prevStats.resolution + 1) }));
            return prev.map(item =>
              item.id === itemToResolve.id ? { ...item, status: "Resolved", isResolved: true } : item
            );
          }
          return prev;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Remove resolved items after a short delay (lets exit animation play)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFeedbackItems(prev => prev.filter(item => !item.isResolved));
    }, 300); // short to keep UI snappy; exit anim handles smoothness
    return () => clearTimeout(timeout);
  }, [feedbackItems]);

  return (
    <section className={`relative w-full bg-white overflow-hidden`}>

      {/* Content */}
      <div className="relative max-w-[1200px] mx-auto px-6 pt-36 lg:pt-40 pb-20">
        <div className="flex items-center justify-center">
          {/* Centered Hero Content */}
          <motion.div
            className="text-center max-w-5xl"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {/* Title */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-6 leading-[1.2]"
              variants={item}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF6D6D] via-[#FFAC4E] to-[#FF6D6D] bg-[length:200%_auto] animate-gradient">
                AI-Powered intelligence
              </span>
              <span className="text-black"> that<br />
              transforms feedback into action</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base sm:text-base md:text-lg text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0"
              variants={item}
            >
              Stop drowning in data. Let AI analyse thousands of customer responses instantly,
              identify critical trends, and deliver actionable recommendations that drive real business results.
            </motion.p>

            {/* Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
              variants={item}
            >
              <Link
                to={primaryCta.to}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative overflow-hidden bg-[#4E74FF] text-white hover:bg-[#2F5CFF] shadow-lg hover:shadow-xl font-satoshi"
              >
                <span>{primaryCta.label}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.33334 8H12.6667M12.6667 8L8.00001 3.33333M12.6667 8L8.00001 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link
                to={secondaryCta.to}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative overflow-hidden bg-black text-white hover:bg-black/90 shadow-lg hover:shadow-xl font-satoshi"
              >
                <span>{secondaryCta.label}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.33334 8H12.6667M12.6667 8L8.00001 3.33333M12.6667 8L8.00001 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom divider curve */}
      <div className="absolute inset-x-0 bottom-0 h-10">
        <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="url(#fade)" />
          <defs>
            <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
              <stop offset="100%" stopColor="rgba(255,255,255,1)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};

export default Hero;
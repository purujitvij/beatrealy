'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Play, ArrowRight, Sparkles, Music, Headphones, Zap, Heart, ChevronDown, Volume2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const heroBg = '/abstract_dark_neon_green_and_black_fluid_waves_for_hero_background.png';
const coverChill = '/neon_gradient_album_art_for_chill_vibes.png';
const coverEnergy = '/high_energy_energetic_album_art.png';
const coverSad = '/sad_emotional_album_art.png';

export default function Home() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);     
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative pb-24">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(29, 185, 84, 0.15) 0%, transparent 70%)' }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, transparent 70%)' }}
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(29, 185, 84, 0.08) 0%, transparent 70%)' }}
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none z-[1]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-6 pt-20"
      >
        <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-2xl"
          >
            {/* Badge */}
            

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[0.95] tracking-tight mb-6"
            >
              <span className="block">An AI that</span>
              <span className="block">understands your</span>
              <span className="block gradient-text">emotions.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xl md:text-2xl text-gray-400 max-w-xl mb-10 leading-relaxed font-light"
            >
              Say anything... even without telling your mood directly.
              <span className="text-white font-medium"> Our AI reads the vibe</span> and creates the perfect playlist.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/chat">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary group"
                >
                  <Play size={20} className="fill-current" />
                  Start Listening
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    initial={{ scale: 1, opacity: 0 }}
                    whileHover={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ background: 'radial-gradient(circle, rgba(29,185,84,0.4) 0%, transparent 70%)' }}
                  />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary"
              >
                <Volume2 size={18} />
                How It Works
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex gap-8 mt-12 pt-8 border-t border-white/10"
            >
              {[
                { value: '10M+', label: 'Tracks' },
                { value: '50+', label: 'Mood Types' },
                { value: '99%', label: 'Accuracy' },
              ].map((stat, i) => (
                <div key={i} className="text-center sm:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Interactive Chat Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, type: "spring", bounce: 0.3 }}
            className="relative w-full flex justify-center lg:justify-end"
          >
            {/* Floating Elements Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="absolute w-[500px] h-[500px] rounded-full opacity-30"
                style={{
                  background: 'radial-gradient(circle, rgba(29,185,84,0.2) 0%, transparent 60%)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              />

              {/* Floating Music Notes */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-primary/20"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + i * 20}%`,
                  }}
                  animate={{
                    y: [-10, 10, -10],
                    rotate: [-5, 5, -5],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                >
                  <Music size={20 + i * 4} />
                </motion.div>
              ))}
            </div>

            {/* Hero Chat Widget */}
            <div className="relative z-10 w-full max-w-xl lg:max-w-2xl">
              <motion.div
                whileHover={{ y: -5, rotateY: 2, rotateX: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              >
                <HeroChatWidget />
              </motion.div>

              {/* Glow Effect */}
              <div className="absolute -inset-6 bg-gradient-to-r from-primary/30 via-purple-500/15 to-primary/30 rounded-3xl blur-3xl -z-10 opacity-70" />
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500"
        >
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown size={20} />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="relative py-32 px-6 md:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              Music that <span className="gradient-text">feels</span> you
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Our AI doesn't just understand words - it reads between the lines to capture your true emotional state.
            </p>
          </motion.div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-6">
            {/* Large Card - Spans 2 columns and 2 rows */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-2 md:row-span-2"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.01 }}
                className="relative p-8 md:p-10 rounded-3xl glass-card hover:border-white/20 transition-all duration-300 group h-full min-h-[300px] md:min-h-full flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-300">
                    <Zap className="w-9 h-9" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Instant Analysis</h3>
                  <p className="text-gray-400 leading-relaxed text-lg max-w-sm">
                    Real-time emotion detection from your natural language input. Our AI understands context, nuance, and subtle emotional cues.
                  </p>
                </div>
                <div className="relative z-10 mt-8 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-[#0a0a0a]" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">50+ emotions detected</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Top Right Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="md:col-span-2"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative p-6 md:p-8 rounded-2xl glass-card hover:border-white/20 transition-all duration-300 group h-full min-h-[180px] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-transparent rounded-full blur-2xl" />
                <div className="relative z-10 flex items-start gap-6">
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-300">
                    <Heart className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Mood Matching</h3>
                    <p className="text-gray-400 leading-relaxed">AI-curated playlists that perfectly match your current vibe and emotional state.</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Bottom Right Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="md:col-span-2"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative p-6 md:p-8 rounded-2xl glass-card hover:border-white/20 transition-all duration-300 group h-full min-h-[180px] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
                <div className="relative z-10 flex items-start gap-6">
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-300">
                    <Headphones className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Premium Sound</h3>
                    <p className="text-gray-400 leading-relaxed">High-quality audio streaming with seamless playback across all your devices.</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Vibes Section */}
      <section className="relative py-32 px-6 md:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <span className="text-primary text-sm font-bold uppercase tracking-widest mb-2 block">Discover</span>
              <h2 className="text-3xl md:text-4xl font-bold">Trending Vibes</h2>
            </div>
            <Link href="/chat" className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors group flex items-center gap-2">
              Explore All
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Late Night Drive", desc: "Synthwave & Chill electronic vibes", image: coverChill, tags: ['Chill', 'Retro', 'Night'] },
              { title: "Gym Pump", desc: "High voltage energy for workouts", image: coverEnergy, tags: ['Workout', 'Aggressive', 'Fast'] },
              { title: "Rainy Days", desc: "Melancholic acoustic soundscapes", image: coverSad, tags: ['Sad', 'Acoustic', 'Slow'] },
            ].map((vibe, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <VibeCard {...vibe} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 blur-3xl -z-10" />

          <div className="glass-card rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Ready to feel the music?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
              Let our AI understand your emotions and create the perfect soundtrack for this moment.
            </p>
            <Link href="/chat">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-lg px-12 py-5"
              >
                <Play size={24} className="fill-current" />
                Start Your Journey
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-40 py-12 px-6 md:px-12 lg:px-16 border-t border-white/5 bg-black">
        <div className=" flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Music className="text-black w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Moodify</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Premium</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} Moodify. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'glass py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className=" px-6 md:px-12 lg:px-16 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <Music className="text-black w-5 h-5" />
          </motion.div>
          <span className="font-bold text-xl tracking-tight">Moodify</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <NavLink href="#">Premium</NavLink>
          <NavLink href="#">Support</NavLink>
          <NavLink href="#">Download</NavLink>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/chat">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="relative text-sm font-medium text-gray-300 hover:text-white transition-colors group">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
    </a>
  );
}

const PLACEHOLDER_TEXTS = [
  "I feel like dancing...",
  "Night rider vibes...",
  "Something for a rainy day...",
  "Feeling melancholic today...",
  "Need energy for my workout...",
  "Late night coding session...",
  "Sunday morning chill...",
  "Road trip playlist...",
];

function HeroChatWidget() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const suggestions = [
    { text: "Something chill", emoji: "🌙" },
    { text: "Workout energy", emoji: "💪" },
    { text: "Feeling nostalgic", emoji: "✨" },
  ];

  useEffect(() => {
    const currentText = PLACEHOLDER_TEXTS[textIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < currentText.length) {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
        }
      }
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, textIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      router.push(`/chat?message=${encodeURIComponent(input.trim())}`);
    }
  };

  return (
    <div className="w-full bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* Window Header */}
      <div className="bg-white/[0.02] px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f57]" />
          <div className="w-3.5 h-3.5 rounded-full bg-[#febc2e]" />
          <div className="w-3.5 h-3.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          Moodify Agent
        </div>
      </div>

      {/* Chat Content */}
      <div className="p-6 md:p-8 space-y-6">
        {/* AI Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <Music className="text-black w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 text-base text-gray-200 leading-relaxed">
              How are you feeling right now? I can play something that matches your vibe perfectly.
            </div>
          </div>
        </motion.div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-5 pl-6 pr-16 text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all text-base"
            />
            {/* Typewriter Placeholder */}
            {!input && (
              <div className="absolute inset-0 flex items-center pl-6 pointer-events-none">
                <span className="text-gray-500 text-base">
                  {displayText}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    className="inline-block w-[2px] h-5 bg-primary ml-0.5 align-middle"
                  />
                </span>
              </div>
            )}
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-2.5 top-2.5 p-3 bg-primary hover:bg-green-400 rounded-xl text-black transition-colors"
          >
            <ArrowRight size={22} />
          </motion.button>
        </form>

        {/* Quick Suggestions */}
        <div className="flex gap-3 flex-wrap">
          {suggestions.map((suggestion, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => router.push(`/chat?message=${encodeURIComponent(suggestion.text)}`)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 px-5 py-2.5 rounded-full text-gray-400 hover:text-white transition-all flex items-center gap-2"
            >
              <span>{suggestion.emoji}</span>
              {suggestion.text}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function VibeCard({ title, desc, image, tags }: { title: string; desc: string; image: string; tags: string[] }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group relative bg-[#121212] hover:bg-[#1a1a1a] p-5 rounded-xl transition-all duration-500 cursor-pointer overflow-hidden"
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Album Art */}
      <div className="relative aspect-square mb-5 overflow-hidden rounded-lg shadow-xl">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

        {/* Play Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          whileHover={{ scale: 1.1 }}
          className="absolute bottom-3 right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-xl shadow-primary/30"
        >
          <Play className="text-black fill-current ml-0.5" size={22} />
        </motion.button>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-bold text-lg text-white mb-1 truncate group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-4">{desc}</p>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] uppercase font-bold tracking-wider bg-white/5 text-gray-400 px-2.5 py-1 rounded-full border border-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

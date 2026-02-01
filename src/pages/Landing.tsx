import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Flame, 
  Brain, 
  Gamepad2, 
  Upload, 
  Trophy,
  ChevronRight,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Upload,
    title: "Smart Upload",
    description: "Upload any document and our AI breaks it into digestible chunks for optimal learning.",
  },
  {
    icon: Brain,
    title: "Adaptive Learning",
    description: "The platform adjusts content difficulty based on your performance. Struggle? We simplify. Ace it? We challenge you.",
  },
  {
    icon: Flame,
    title: "Streak System",
    description: "Build learning habits with daily streaks. Don't break the chain!",
  },
  {
    icon: Gamepad2,
    title: "Flashcard Games",
    description: "Four exciting game modes to make revision fun and engaging.",
  },
  {
    icon: Trophy,
    title: "Achievements",
    description: "Earn and download beautiful badges as you hit learning milestones.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Quizzes",
    description: "Automatically generated quizzes test your understanding after each section.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 bg-hero-pattern">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto text-center relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-bg-primary glow-primary mb-8"
          >
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="gradient-text-primary">MindForge</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Adaptive learning that evolves with you. Upload any material, 
            and let AI transform it into personalized bite-sized lessons.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gradient-bg-primary text-primary-foreground text-lg px-8 py-6 glow-primary hover:scale-105 transition-transform"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth?mode=login")}
              className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10"
            >
              Sign In
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-12 mt-16"
          >
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text-primary">10K+</p>
              <p className="text-sm text-muted-foreground">Active Learners</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text-accent">50K+</p>
              <p className="text-sm text-muted-foreground">Documents Processed</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text-primary">95%</p>
              <p className="text-sm text-muted-foreground">Retention Rate</p>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/50 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-card/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Everything you need to{" "}
              <span className="gradient-text-primary">master anything</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              MindForge combines AI-powered document analysis with gamified learning 
              to help you retain information faster and longer.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 group hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card-elevated max-w-3xl mx-auto p-12"
          >
            <div className="inline-flex items-center gap-2 streak-badge mb-6">
              <Flame className="w-5 h-5" />
              <span className="font-semibold">Start Your Streak Today</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to transform how you learn?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of learners who are using MindForge to study smarter, 
              not harder. Your journey to mastery starts here.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gradient-bg-primary text-primary-foreground text-lg px-8 py-6 glow-primary hover:scale-105 transition-transform"
            >
              Create Free Account
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">MindForge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 MindForge. Built with ❤️ for learners.
          </p>
        </div>
      </footer>
    </div>
  );
}

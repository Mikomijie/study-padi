import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const mockUser = {
  name: "Alex Johnson",
  avatar: "",
  streak: 12,
};

interface Chunk {
  id: string;
  content: string;
  highlightedTerms?: string[];
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const mockChunks: Chunk[] = [
  {
    id: "1",
    content: `Newton's Laws of Motion form the foundation of classical mechanics. These three laws describe the relationship between the motion of an object and the forces acting upon it.

Sir Isaac Newton published these laws in 1687 in his work "Philosophiæ Naturalis Principia Mathematica." They revolutionized our understanding of physics and remain fundamental to engineering and science today.

The laws apply to everyday objects moving at speeds much slower than the speed of light. For very fast objects or very small particles, we need Einstein's relativity or quantum mechanics instead.`,
    highlightedTerms: ["Newton's Laws of Motion"],
  },
  {
    id: "2",
    content: `Newton's First Law (Law of Inertia) states: An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an external force.

This means objects naturally resist changes to their state of motion. A book on a table won't move unless you push it. A rolling ball would roll forever if there were no friction or air resistance.

Inertia is directly related to mass - the more massive an object, the more force is needed to change its motion. This is why it's harder to push a heavy truck than a light bicycle.`,
    highlightedTerms: ["inertia", "First Law"],
  },
  {
    id: "3",
    content: `Newton's Second Law states: Force equals mass times acceleration (F = ma). This is the most useful of the three laws for solving physics problems.

The law tells us that:
- More force means more acceleration
- More mass means less acceleration for the same force
- Force and acceleration are in the same direction

For example, if you push a 10 kg box with 20 N of force, it accelerates at 2 m/s². If you push a 20 kg box with the same force, it only accelerates at 1 m/s².`,
    highlightedTerms: ["F = ma", "Second Law"],
  },
  {
    id: "4",
    content: `Newton's Third Law states: For every action, there is an equal and opposite reaction.

When you push against a wall, the wall pushes back on you with equal force. When you jump, you push down on the Earth and the Earth pushes you up. When a rocket expels gas downward, the gas pushes the rocket upward.

These action-reaction pairs always act on different objects. They're equal in magnitude, opposite in direction, and occur simultaneously. Understanding this helps explain how rockets work in the vacuum of space!`,
    highlightedTerms: ["Third Law", "action-reaction"],
  },
];

const mockQuestions: Question[] = [
  {
    id: "1",
    question: "What does Newton's First Law describe?",
    options: [
      "Force equals mass times acceleration",
      "Objects resist changes to their state of motion (inertia)",
      "Every action has an equal and opposite reaction",
      "Energy cannot be created or destroyed",
    ],
    correctAnswer: 1,
    explanation: "Newton's First Law, also called the Law of Inertia, states that objects at rest stay at rest and objects in motion stay in motion unless acted upon by an external force.",
  },
  {
    id: "2",
    question: "According to F = ma, if you double the force applied to an object, what happens to its acceleration?",
    options: [
      "It stays the same",
      "It doubles",
      "It halves",
      "It quadruples",
    ],
    correctAnswer: 1,
    explanation: "From F = ma, if mass stays constant and force doubles, acceleration must also double to maintain the equation's balance.",
  },
  {
    id: "3",
    question: "When you push against a wall, what does Newton's Third Law tell us?",
    options: [
      "The wall doesn't push back",
      "The wall pushes back with less force",
      "The wall pushes back with equal force in the opposite direction",
      "The wall absorbs all the force",
    ],
    correctAnswer: 2,
    explanation: "Newton's Third Law states that for every action there's an equal and opposite reaction. When you push on the wall, the wall pushes back on you with the same magnitude of force.",
  },
  {
    id: "4",
    question: "Why is it harder to push a heavy truck than a light bicycle?",
    options: [
      "The truck has more friction",
      "The truck has more inertia due to its greater mass",
      "The bicycle has wheels",
      "The truck is taller",
    ],
    correctAnswer: 1,
    explanation: "More massive objects have greater inertia, meaning they resist changes to their motion more strongly. According to F = ma, more mass means you need more force to achieve the same acceleration.",
  },
];

type LearningPhase = "study" | "quiz" | "results";

export default function Learn() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phase, setPhase] = useState<LearningPhase>("study");
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  const [startTime] = useState(Date.now());
  const [chunkStartTime, setChunkStartTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=login");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - chunkStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [chunkStartTime]);

  const currentChunk = mockChunks[currentChunkIndex];
  const currentQuestion = mockQuestions[currentQuestionIndex];
  const progress = phase === "study" 
    ? ((currentChunkIndex + 1) / mockChunks.length) * 100
    : ((currentQuestionIndex + 1) / mockQuestions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNextChunk = () => {
    if (currentChunkIndex < mockChunks.length - 1) {
      setCurrentChunkIndex((prev) => prev + 1);
      setChunkStartTime(Date.now());
    } else {
      setPhase("quiz");
      toast({
        title: "Section Complete! 🎉",
        description: "Now let's test your understanding with a quick quiz.",
      });
    }
  };

  const handlePrevChunk = () => {
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex((prev) => prev - 1);
      setChunkStartTime(Date.now());
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setAnswers((prev) => [...prev, { questionId: currentQuestion.id, isCorrect }]);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setPhase("results");
    }
  };

  const score = answers.filter((a) => a.isCorrect).length;
  const scorePercentage = Math.round((score / mockQuestions.length) * 100);

  const renderContent = () => {
    if (phase === "study") {
      return (
        <motion.div
          key={currentChunk.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          {/* Chunk Content */}
          <div className="glass-card p-8">
            <div className="prose prose-invert max-w-none">
              {currentChunk.content.split("\n\n").map((paragraph, idx) => {
                let content = paragraph;
                currentChunk.highlightedTerms?.forEach((term) => {
                  content = content.replace(
                    new RegExp(`(${term})`, "gi"),
                    '<mark class="bg-warning/30 text-warning px-1 rounded">$1</mark>'
                  );
                });
                return (
                  <p
                    key={idx}
                    className="text-foreground/90 leading-relaxed mb-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevChunk}
              disabled={currentChunkIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNextChunk}
              className="gradient-bg-primary text-primary-foreground"
            >
              {currentChunkIndex === mockChunks.length - 1 ? "Take Quiz" : "Next Chunk"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      );
    }

    if (phase === "quiz") {
      return (
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          {/* Question */}
          <div className="glass-card p-8">
            <h3 className="text-xl font-semibold mb-6">{currentQuestion.question}</h3>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                const showResult = showExplanation;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                    className={cn(
                      "w-full p-4 text-left rounded-lg border-2 transition-all",
                      !showResult && isSelected && "border-primary bg-primary/10",
                      !showResult && !isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
                      showResult && isCorrect && "border-success bg-success/10",
                      showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                      showResult && !isSelected && !isCorrect && "border-border opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        !showResult && isSelected && "bg-primary text-primary-foreground",
                        !showResult && !isSelected && "bg-muted text-muted-foreground",
                        showResult && isCorrect && "bg-success text-success-foreground",
                        showResult && isSelected && !isCorrect && "bg-destructive text-destructive-foreground"
                      )}>
                        {showResult ? (
                          isCorrect ? <CheckCircle className="w-5 h-5" /> : 
                          isSelected ? <XCircle className="w-5 h-5" /> : 
                          String.fromCharCode(65 + index)
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Explanation</p>
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit/Next Button */}
          {!showExplanation ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="w-full h-12 gradient-bg-primary text-primary-foreground"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              className="w-full h-12 gradient-bg-primary text-primary-foreground"
            >
              {currentQuestionIndex === mockQuestions.length - 1 ? "See Results" : "Next Question"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </motion.div>
      );
    }

    if (phase === "results") {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card-elevated p-8 text-center"
        >
          <div className={cn(
            "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center",
            scorePercentage >= 80 ? "bg-success/20" : 
            scorePercentage >= 60 ? "bg-warning/20" : "bg-destructive/20"
          )}>
            <span className={cn(
              "text-4xl font-bold",
              scorePercentage >= 80 ? "text-success" : 
              scorePercentage >= 60 ? "text-warning" : "text-destructive"
            )}>
              {scorePercentage}%
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold mb-2">
            {scorePercentage >= 80 ? "Excellent! 🎉" : 
             scorePercentage >= 60 ? "Good job! 👍" : "Keep practicing! 💪"}
          </h2>
          <p className="text-muted-foreground mb-6">
            You got {score} out of {mockQuestions.length} questions correct.
          </p>

          {/* Adaptive feedback */}
          <div className="glass-card p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium mb-1">Adaptive Learning Update</p>
                <p className="text-sm text-muted-foreground">
                  {scorePercentage >= 80 
                    ? "Great performance! Next section will use larger chunks to challenge you more."
                    : scorePercentage >= 60 
                    ? "Good progress! We'll keep the current chunk size for now."
                    : "We noticed some difficulty. Next section will use smaller, more focused chunks to help you learn better."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex-1"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => {
                setPhase("study");
                setCurrentChunkIndex(0);
                setCurrentQuestionIndex(0);
                setAnswers([]);
                setSelectedAnswer(null);
                setShowExplanation(false);
              }}
              className="flex-1 gradient-bg-primary text-primary-foreground"
            >
              Study Again
            </Button>
          </div>
        </motion.div>
      );
    }
  };

  return (
    <AppLayout user={mockUser}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeSpent)}</span>
            </div>
          </div>

          {phase !== "results" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">
                  {phase === "study" ? "Newton's Laws of Motion" : "Section Quiz"}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {phase === "study" 
                    ? `Chunk ${currentChunkIndex + 1} of ${mockChunks.length}`
                    : `Question ${currentQuestionIndex + 1} of ${mockQuestions.length}`}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </>
          )}
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

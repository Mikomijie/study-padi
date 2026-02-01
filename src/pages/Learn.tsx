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
    content: `Machine learning is a subset of artificial intelligence (AI) that enables computers to learn from data without being explicitly programmed. The fundamental idea is that systems can identify patterns, make decisions, and improve over time through experience.

There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Each approach has its own strengths and is suited for different types of problems.

In supervised learning, the algorithm is trained on labeled data, meaning each training example is paired with an output label. The goal is to learn a mapping from inputs to outputs that can be used to predict labels for new, unseen data.`,
    highlightedTerms: ["supervised learning"],
  },
  {
    id: "2",
    content: `Unsupervised learning, in contrast, works with unlabeled data. The algorithm tries to find hidden patterns or structures in the data without any guidance. Common applications include clustering, dimensionality reduction, and anomaly detection.

Clustering algorithms like K-means and hierarchical clustering are used to group similar data points together. This is useful in customer segmentation, image compression, and many other applications.

Dimensionality reduction techniques like PCA (Principal Component Analysis) help reduce the number of features in a dataset while preserving the most important information.`,
  },
  {
    id: "3",
    content: `Reinforcement learning is a type of machine learning where an agent learns to make decisions by interacting with an environment. The agent receives rewards or penalties based on its actions and learns to maximize cumulative reward over time.

Key concepts in reinforcement learning include:
- Agent: The learner or decision maker
- Environment: The world the agent interacts with
- State: The current situation of the agent
- Action: The choices available to the agent
- Reward: Feedback from the environment

Famous examples include AlphaGo, which mastered the game of Go, and robotic systems that learn to walk or manipulate objects.`,
    highlightedTerms: ["reinforcement learning"],
  },
];

const mockQuestions: Question[] = [
  {
    id: "1",
    question: "What is the main difference between supervised and unsupervised learning?",
    options: [
      "Supervised learning is faster",
      "Supervised learning uses labeled data, unsupervised uses unlabeled data",
      "Unsupervised learning requires more computing power",
      "There is no difference",
    ],
    correctAnswer: 1,
    explanation: "In supervised learning, the algorithm is trained on labeled data where each example has an output label. Unsupervised learning works with unlabeled data to find patterns.",
  },
  {
    id: "2",
    question: "Which algorithm is commonly used for clustering in unsupervised learning?",
    options: [
      "Linear Regression",
      "K-means",
      "Neural Networks",
      "Decision Trees",
    ],
    correctAnswer: 1,
    explanation: "K-means is a popular clustering algorithm used in unsupervised learning to group similar data points together.",
  },
  {
    id: "3",
    question: "In reinforcement learning, what does the agent try to maximize?",
    options: [
      "Accuracy",
      "Speed",
      "Cumulative reward",
      "Data size",
    ],
    correctAnswer: 2,
    explanation: "In reinforcement learning, the agent learns to make decisions by maximizing cumulative reward over time through interaction with the environment.",
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
                  {phase === "study" ? "Introduction to Machine Learning" : "Section Quiz"}
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

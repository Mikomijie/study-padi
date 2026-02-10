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
  Target,
  Lightbulb,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Chunk {
  id: string;
  content: string;
  word_count: number;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
}

interface Section {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
}

type LearningPhase = "loading" | "select" | "study" | "quiz" | "results";

export default function Learn() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { documentId } = useParams();
  
  const [phase, setPhase] = useState<LearningPhase>("loading");
  const [userName, setUserName] = useState("Learner");
  const [userStreak, setUserStreak] = useState(0);
  
  // Document data
  const [documents, setDocuments] = useState<{ id: string; title: string; sections: Section[] }[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documentId || null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("");
  
  // Learning data
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  const [chunkStartTime, setChunkStartTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  // Auth & profile
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?mode=login"); return; }
      
      const { data: profile } = await supabase.from("profiles").select("display_name, streak_count").eq("user_id", session.user.id).single();
      if (profile) {
        setUserName(profile.display_name || "Learner");
        setUserStreak(profile.streak_count || 0);
      }

      // Load user's documents with sections
      const { data: docs } = await supabase
        .from("documents")
        .select("id, title, sections(id, title, order_index, completed)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (docs && docs.length > 0) {
        const formatted = docs.map((d: any) => ({
          id: d.id,
          title: d.title,
          sections: (d.sections || []).sort((a: any, b: any) => a.order_index - b.order_index),
        }));
        setDocuments(formatted);

        if (documentId) {
          const doc = formatted.find((d: any) => d.id === documentId);
          if (doc) {
            setSelectedDocId(doc.id);
            setDocTitle(doc.title);
            // Auto-select first incomplete section
            const nextSection = doc.sections.find((s: any) => !s.completed) || doc.sections[0];
            if (nextSection) {
              loadSection(nextSection.id, doc.title);
            } else {
              setPhase("select");
            }
            return;
          }
        }
        setPhase("select");
      } else {
        setPhase("select");
      }
    };
    init();
  }, [navigate, documentId]);

  // Timer
  useEffect(() => {
    if (phase !== "study") return;
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - chunkStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [chunkStartTime, phase]);

  const loadSection = async (sectionId: string, title?: string) => {
    setPhase("loading");
    setSelectedSectionId(sectionId);
    
    const [chunksRes, questionsRes] = await Promise.all([
      supabase.from("chunks").select("*").eq("section_id", sectionId).order("order_index"),
      supabase.from("questions").select("*").eq("section_id", sectionId),
    ]);

    if (chunksRes.data && chunksRes.data.length > 0) {
      setChunks(chunksRes.data);
      setQuestions((questionsRes.data || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
      })));
      setCurrentChunkIndex(0);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setChunkStartTime(Date.now());
      if (title) setDocTitle(title);
      setPhase("study");
    } else {
      toast({ title: "No content", description: "This section has no learning content yet.", variant: "destructive" });
      setPhase("select");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNextChunk = () => {
    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex((prev) => prev + 1);
      setChunkStartTime(Date.now());
    } else {
      if (questions.length > 0) {
        setPhase("quiz");
        toast({ title: "Section Complete!", description: "Now let's test your understanding with a quick quiz." });
      } else {
        setPhase("results");
      }
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
    const q = questions[currentQuestionIndex];
    const isCorrect = q.options[selectedAnswer] === q.correct_answer;
    setAnswers((prev) => [...prev, { questionId: q.id, isCorrect }]);
    setShowExplanation(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Mark section as completed
      if (selectedSectionId) {
        await supabase.from("sections").update({ completed: true }).eq("id", selectedSectionId);
      }
      // Save test attempt
      const { data: { session } } = await supabase.auth.getSession();
      if (session && selectedSectionId) {
        const score = Math.round((answers.filter(a => a.isCorrect).length / questions.length) * 100);
        await supabase.from("test_attempts").insert({
          user_id: session.user.id,
          section_id: selectedSectionId,
          score,
          wrong_answers: answers.filter(a => !a.isCorrect).map(a => a.questionId),
        });
      }
      setPhase("results");
    }
  };

  const score = answers.filter((a) => a.isCorrect).length;
  const scorePercentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 100;

  const progress = phase === "study" 
    ? ((currentChunkIndex + 1) / chunks.length) * 100
    : phase === "quiz" && questions.length > 0
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 100;

  const user = { name: userName, avatar: "", streak: userStreak };

  if (phase === "loading") {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (phase === "select") {
    return (
      <AppLayout user={user}>
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              <span className="gradient-text-primary">Continue Learning</span>
            </h1>
            <p className="text-muted-foreground text-sm">Select a document and section to study.</p>
          </motion.div>

          {documents.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No documents yet. Upload one to start learning!</p>
              <Button onClick={() => navigate("/upload")} className="gradient-bg-primary text-primary-foreground">
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc, dIdx) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dIdx * 0.1 }}
                  className="glass-card p-4 sm:p-6"
                >
                  <h2 className="font-semibold text-lg mb-3">{doc.title}</h2>
                  <div className="space-y-2">
                    {doc.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => { setSelectedDocId(doc.id); loadSection(section.id, doc.title); }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg border transition-all min-h-[48px]",
                          section.completed
                            ? "border-success/30 bg-success/5 hover:bg-success/10"
                            : "border-border hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {section.completed ? (
                            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium">{section.title}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  const currentChunk = chunks[currentChunkIndex];
  const currentQuestion = questions[currentQuestionIndex];

  const renderContent = () => {
    if (phase === "study" && currentChunk) {
      return (
        <motion.div
          key={currentChunk.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4 sm:space-y-6"
        >
          <div className="glass-card p-5 sm:p-8">
            <div className="prose prose-invert max-w-none">
              {currentChunk.content.split("\n\n").map((paragraph, idx) => (
                <p key={idx} className="text-foreground/90 leading-relaxed mb-4 text-sm sm:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={handlePrevChunk} disabled={currentChunkIndex === 0} className="min-h-[44px]">
              <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button onClick={handleNextChunk} className="gradient-bg-primary text-primary-foreground min-h-[44px]">
              {currentChunkIndex === chunks.length - 1 ? (questions.length > 0 ? "Take Quiz" : "Finish") : "Next"}
              <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
            </Button>
          </div>
        </motion.div>
      );
    }

    if (phase === "quiz" && currentQuestion) {
      return (
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4 sm:space-y-6"
        >
          <div className="glass-card p-5 sm:p-8">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">{currentQuestion.question_text}</h3>
            
            <div className="space-y-2 sm:space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = option === currentQuestion.correct_answer;
                const showResult = showExplanation;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                    className={cn(
                      "w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all min-h-[48px]",
                      !showResult && isSelected && "border-primary bg-primary/10",
                      !showResult && !isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
                      showResult && isCorrect && "border-success bg-success/10",
                      showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                      showResult && !isSelected && !isCorrect && "border-border opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0",
                        !showResult && isSelected && "bg-primary text-primary-foreground",
                        !showResult && !isSelected && "bg-muted text-muted-foreground",
                        showResult && isCorrect && "bg-success text-success-foreground",
                        showResult && isSelected && !isCorrect && "bg-destructive text-destructive-foreground"
                      )}>
                        {showResult ? (
                          isCorrect ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : 
                          isSelected ? <XCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : 
                          String.fromCharCode(65 + index)
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </div>
                      <span className="text-sm sm:text-base">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {showExplanation && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1 text-sm sm:text-base">Explanation</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {!showExplanation ? (
            <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null} className="w-full h-11 sm:h-12 gradient-bg-primary text-primary-foreground">
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} className="w-full h-11 sm:h-12 gradient-bg-primary text-primary-foreground">
              {currentQuestionIndex === questions.length - 1 ? "See Results" : "Next Question"}
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
          className="glass-card-elevated p-6 sm:p-8 text-center"
        >
          <div className={cn(
            "w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center",
            scorePercentage >= 80 ? "bg-success/20" : scorePercentage >= 60 ? "bg-warning/20" : "bg-destructive/20"
          )}>
            <span className={cn(
              "text-3xl sm:text-4xl font-bold",
              scorePercentage >= 80 ? "text-success" : scorePercentage >= 60 ? "text-warning" : "text-destructive"
            )}>
              {scorePercentage}%
            </span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            {scorePercentage >= 80 ? (
              <>Excellent! <CheckCircle className="w-6 h-6 text-success" /></>
            ) : scorePercentage >= 60 ? (
              <>Good job! <Target className="w-6 h-6 text-warning" /></>
            ) : (
              <>Keep practicing! <AlertCircle className="w-6 h-6 text-destructive" /></>
            )}
          </h2>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
            You got {score} out of {questions.length} questions correct.
          </p>

          <div className="glass-card p-4 mb-4 sm:mb-6 text-left">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1 text-sm sm:text-base">Adaptive Learning Update</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {scorePercentage >= 80 
                    ? "Great performance! Next section will use larger chunks to challenge you more."
                    : scorePercentage >= 60 
                    ? "Good progress! We'll keep the current chunk size for now."
                    : "We noticed some difficulty. Next section will use smaller, more focused chunks to help you learn better."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex-1 min-h-[44px]">
              Back to Dashboard
            </Button>
            <Button
              onClick={() => setPhase("select")}
              className="flex-1 gradient-bg-primary text-primary-foreground min-h-[44px]"
            >
              Next Section
            </Button>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <AppLayout user={user}>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-muted-foreground min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeSpent)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg gradient-bg-primary">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg sm:text-xl font-bold">{docTitle || "Learning"}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {phase === "study" 
                  ? `Chunk ${currentChunkIndex + 1} of ${chunks.length}`
                  : phase === "quiz"
                  ? `Question ${currentQuestionIndex + 1} of ${questions.length}`
                  : "Results"}
              </p>
            </div>
          </div>

          <Progress value={progress} className="h-2" />
        </motion.div>

        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

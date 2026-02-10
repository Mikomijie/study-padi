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
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const mockUser = { name: "Alex Johnson", avatar: "", streak: 12 };

interface DBSection {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
}

interface DBChunk {
  id: string;
  content: string;
  order_index: number;
  word_count: number;
}

interface DBQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
}

type LearningPhase = "study" | "quiz" | "results";

export default function Learn() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth?mode=login");
    };
    checkAuth();
  }, [navigate]);

  if (!courseId) {
    return <DocumentList />;
  }

  return <LearningExperience documentId={courseId} />;
}

// ──── Document List ────
function DocumentList() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("documents")
        .select("id, title, original_filename, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setDocuments(data || []);
      setLoading(false);
    };
    fetchDocs();
  }, []);

  return (
    <AppLayout user={mockUser}>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text-primary">Learn</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">Select a document to start learning.</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : documents.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No documents yet</h2>
            <p className="text-muted-foreground mb-4 text-sm">Upload a document to start learning with AI-powered sections and quizzes.</p>
            <Button onClick={() => navigate("/upload")} className="gradient-bg-primary text-primary-foreground">
              <Upload className="w-4 h-4 mr-2" /> Upload Document
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <motion.button
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/learn/${doc.id}`)}
                className="w-full glass-card p-4 sm:p-5 text-left hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-bg-primary flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ──── Learning Experience ────
function LearningExperience({ documentId }: { documentId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [docTitle, setDocTitle] = useState("");
  const [sections, setSections] = useState<DBSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [chunks, setChunks] = useState<DBChunk[]>([]);
  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState<LearningPhase>("study");
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  const [chunkStartTime, setChunkStartTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  // Fetch document data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: doc } = await supabase.from("documents").select("title").eq("id", documentId).single();
      if (!doc) { navigate("/learn"); return; }
      setDocTitle(doc.title);

      const { data: secs } = await supabase
        .from("sections")
        .select("id, title, order_index, completed")
        .eq("document_id", documentId)
        .order("order_index");

      if (!secs || secs.length === 0) { navigate("/learn"); return; }
      setSections(secs);
      await loadSection(secs[0].id);
      setLoading(false);
    };
    fetchData();
  }, [documentId]);

  const loadSection = async (sectionId: string) => {
    const [chunksRes, questionsRes] = await Promise.all([
      supabase.from("chunks").select("id, content, order_index, word_count").eq("section_id", sectionId).order("order_index"),
      supabase.from("questions").select("id, question_text, options, correct_answer, explanation").eq("section_id", sectionId),
    ]);
    setChunks(chunksRes.data || []);
    setQuestions((questionsRes.data as any as DBQuestion[]) || []);
    setCurrentChunkIndex(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers([]);
    setPhase("study");
    setChunkStartTime(Date.now());
  };

  useEffect(() => {
    const timer = setInterval(() => setTimeSpent(Math.floor((Date.now() - chunkStartTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [chunkStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <AppLayout user={mockUser}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const currentChunk = chunks[currentChunkIndex];
  const currentQuestion = questions[currentQuestionIndex];
  const currentSection = sections[currentSectionIndex];
  const progress = phase === "study"
    ? ((currentChunkIndex + 1) / Math.max(chunks.length, 1)) * 100
    : ((currentQuestionIndex + 1) / Math.max(questions.length, 1)) * 100;

  const handleNextChunk = () => {
    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex((prev) => prev + 1);
      setChunkStartTime(Date.now());
    } else {
      if (questions.length > 0) {
        setPhase("quiz");
        toast({ title: "Section Complete!", description: "Now let's test your understanding." });
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
    if (selectedAnswer === null || !currentQuestion) return;
    const selectedText = (currentQuestion.options as string[])[selectedAnswer];
    const isCorrect = selectedText === currentQuestion.correct_answer;
    setAnswers((prev) => [...prev, { questionId: currentQuestion.id, isCorrect }]);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setPhase("results");
    }
  };

  const score = answers.filter((a) => a.isCorrect).length;
  const scorePercentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 100;

  const handleNextSection = async () => {
    if (currentSectionIndex < sections.length - 1) {
      const nextIdx = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIdx);
      await loadSection(sections[nextIdx].id);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <AppLayout user={mockUser}>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/learn")} className="mb-4 text-muted-foreground min-h-[44px]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Documents
          </Button>
          <h1 className="font-display text-xl sm:text-2xl font-bold mb-1 truncate">{docTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Section {currentSectionIndex + 1}/{sections.length}: {currentSection?.title}
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
            <span>{phase === "study" ? `Chunk ${currentChunkIndex + 1}/${chunks.length}` : `Question ${currentQuestionIndex + 1}/${questions.length}`}</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeSpent)}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {/* Study Phase */}
          {phase === "study" && currentChunk && (
            <motion.div key={`chunk-${currentChunk.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 sm:space-y-6">
              <div className="glass-card p-5 sm:p-8">
                <div className="prose prose-invert max-w-none">
                  {currentChunk.content.split("\n\n").map((paragraph, idx) => (
                    <p key={idx} className="text-foreground/90 leading-relaxed mb-4 text-sm sm:text-base">{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={handlePrevChunk} disabled={currentChunkIndex === 0} className="min-h-[44px]">
                  <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button onClick={handleNextChunk} className="gradient-bg-primary text-primary-foreground min-h-[44px]">
                  {currentChunkIndex === chunks.length - 1 ? (questions.length > 0 ? "Take Quiz" : "Complete") : "Next"}
                  <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Quiz Phase */}
          {phase === "quiz" && currentQuestion && (
            <motion.div key={`q-${currentQuestion.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 sm:space-y-6">
              <div className="glass-card p-5 sm:p-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">{currentQuestion.question_text}</h3>
                <div className="space-y-2 sm:space-y-3">
                  {(currentQuestion.options as string[]).map((option, index) => {
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
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
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
          )}

          {/* Results Phase */}
          {phase === "results" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-elevated p-6 sm:p-8 text-center">
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
                {scorePercentage >= 80 ? <><span>Excellent!</span> <CheckCircle className="w-6 h-6 text-success" /></> :
                 scorePercentage >= 60 ? <><span>Good job!</span> <Target className="w-6 h-6 text-warning" /></> :
                 <><span>Keep practicing!</span> <AlertCircle className="w-6 h-6 text-destructive" /></>}
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
                        : "We noticed some difficulty. Next section will use smaller, more focused chunks."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex-1 min-h-[44px]">
                  Back to Dashboard
                </Button>
                <Button onClick={handleNextSection} className="flex-1 gradient-bg-primary text-primary-foreground min-h-[44px]">
                  {currentSectionIndex < sections.length - 1 ? "Next Section" : "Finish Course"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

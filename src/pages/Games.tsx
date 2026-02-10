import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Gamepad2, 
  Zap, 
  Grid3X3, 
  Swords,
  ArrowLeft,
  Check,
  X,
  Clock,
  Heart,
  Trophy,
  RotateCcw,
  ChevronRight,
  Repeat,
  Loader2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  term: string;
  definition: string;
  difficulty: "easy" | "medium" | "hard";
}

type GameMode = null | "classic" | "speed" | "memory" | "battle";

const gameInfo = [
  { mode: "classic" as GameMode, icon: RotateCcw, title: "Classic Flashcards", description: "Flip cards and mark as known or review", color: "primary" },
  { mode: "speed" as GameMode, icon: Zap, title: "Speed Challenge", description: "60 seconds to score as high as possible", color: "accent" },
  { mode: "memory" as GameMode, icon: Grid3X3, title: "Memory Match", description: "Match terms with their definitions", color: "success" },
  { mode: "battle" as GameMode, icon: Swords, title: "Quiz Battle", description: "10 questions, 3 lives. Survive!", color: "warning" },
];

export default function Games() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("Learner");
  const [userStreak, setUserStreak] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?mode=login"); return; }

      const { data: profile } = await supabase.from("profiles").select("display_name, streak_count").eq("user_id", session.user.id).single();
      if (profile) {
        setUserName(profile.display_name || "Learner");
        setUserStreak(profile.streak_count || 0);
      }

      // Load flashcards from DB
      const { data: dbFlashcards } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (dbFlashcards && dbFlashcards.length > 0) {
        setFlashcards(dbFlashcards.map((f: any) => ({
          id: f.id,
          term: f.term,
          definition: f.definition,
          difficulty: f.difficulty_level as "easy" | "medium" | "hard",
        })));
      } else {
        // Fall back to generating flashcards from questions in the user's documents
        const { data: docs } = await supabase
          .from("documents")
          .select("id")
          .eq("user_id", session.user.id);

        if (docs && docs.length > 0) {
          const docIds = docs.map((d: any) => d.id);
          const { data: sections } = await supabase
            .from("sections")
            .select("id")
            .in("document_id", docIds);

          if (sections && sections.length > 0) {
            const sectionIds = sections.map((s: any) => s.id);
            const { data: questions } = await supabase
              .from("questions")
              .select("*")
              .in("section_id", sectionIds)
              .limit(20);

            if (questions && questions.length > 0) {
              const generated = questions.map((q: any) => ({
                id: q.id,
                term: q.question_text,
                definition: q.correct_answer,
                difficulty: "medium" as const,
              }));
              setFlashcards(generated);
            }
          }
        }
      }

      setIsLoading(false);
    };
    init();
  }, [navigate]);

  const user = { name: userName, avatar: "", streak: userStreak };

  if (isLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const renderGameSelection = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-2 gap-4 sm:gap-6">
      {gameInfo.map((game, index) => (
        <motion.button
          key={game.mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => {
            if (flashcards.length === 0) {
              toast({ title: "No flashcards", description: "Upload a document first to generate flashcards!", variant: "destructive" });
              return;
            }
            setGameMode(game.mode);
          }}
          className={cn(
            "glass-card p-5 sm:p-6 text-left group hover:border-primary/50 transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98] min-h-[120px]",
            flashcards.length === 0 && "opacity-60"
          )}
        >
          <div className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-110",
            game.color === "primary" && "gradient-bg-primary",
            game.color === "accent" && "gradient-bg-accent",
            game.color === "success" && "bg-success",
            game.color === "warning" && "bg-warning"
          )}>
            <game.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h3 className="font-semibold text-base sm:text-lg mb-1 group-hover:text-primary transition-colors">{game.title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{game.description}</p>
        </motion.button>
      ))}
    </motion.div>
  );

  return (
    <AppLayout user={user}>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          {gameMode ? (
            <Button variant="ghost" onClick={() => setGameMode(null)} className="mb-4 text-muted-foreground min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          ) : (
            <>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                <span className="gradient-text-primary">Flashcard</span> Games
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {flashcards.length > 0
                  ? `${flashcards.length} flashcards ready. Choose a game mode!`
                  : "Upload a document to generate flashcards for games."}
              </p>
            </>
          )}
        </motion.div>

        {flashcards.length === 0 && !gameMode && (
          <div className="glass-card p-8 text-center mb-6">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No flashcards yet. Upload and analyze a document to generate them!</p>
            <Button onClick={() => navigate("/upload")} className="gradient-bg-primary text-primary-foreground">
              Upload Document
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!gameMode && renderGameSelection()}
          {gameMode === "classic" && <ClassicFlashcards flashcards={flashcards} onComplete={() => setGameMode(null)} />}
          {gameMode === "speed" && <SpeedChallenge flashcards={flashcards} onComplete={() => setGameMode(null)} />}
          {gameMode === "memory" && <MemoryMatch flashcards={flashcards.slice(0, 6)} onComplete={() => setGameMode(null)} />}
          {gameMode === "battle" && <QuizBattle flashcards={flashcards} onComplete={() => setGameMode(null)} />}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

// Classic Flashcards Game
function ClassicFlashcards({ flashcards, onComplete }: { flashcards: Flashcard[]; onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const currentCard = flashcards[currentIndex];
  const isComplete = currentIndex >= flashcards.length;

  const handleKnown = () => { setKnownCount((prev) => prev + 1); setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => prev + 1), 200); };
  const handleReview = () => { setReviewCount((prev) => prev + 1); setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => prev + 1), 200); };

  if (isComplete) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-elevated p-6 sm:p-8 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success/20 mx-auto mb-4 flex items-center justify-center">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Session Complete!</h2>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">You marked {knownCount} cards as known and {reviewCount} for review.</p>
        <Button onClick={onComplete} className="gradient-bg-primary text-primary-foreground min-h-[44px]">Back to Games</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <span>Card {currentIndex + 1} of {flashcards.length}</span>
        <div className="flex gap-4">
          <span className="text-success flex items-center gap-1"><Check className="w-4 h-4" /> {knownCount}</span>
          <span className="text-warning flex items-center gap-1"><Repeat className="w-4 h-4" /> {reviewCount}</span>
        </div>
      </div>
      <Progress value={((currentIndex) / flashcards.length) * 100} className="h-2" />
      <div onClick={() => setIsFlipped(!isFlipped)} className="flashcard h-48 sm:h-64 cursor-pointer">
        <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5 }} className="flashcard-inner" style={{ transformStyle: "preserve-3d" }}>
          <div className="flashcard-face glass-card-elevated flex flex-col items-center justify-center p-6 sm:p-8" style={{ backfaceVisibility: "hidden" }}>
            <span className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Term</span>
            <h3 className="text-xl sm:text-2xl font-bold text-center gradient-text-primary">{currentCard.term}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-4">Click to flip</p>
          </div>
          <div className="flashcard-face glass-card-elevated flex flex-col items-center justify-center p-6 sm:p-8" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <span className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Definition</span>
            <p className="text-sm sm:text-lg text-center">{currentCard.definition}</p>
          </div>
        </motion.div>
      </div>
      <div className="flex gap-3 sm:gap-4">
        <Button onClick={handleReview} variant="outline" className="flex-1 h-11 sm:h-12 border-warning text-warning hover:bg-warning/10 min-h-[44px]">
          <X className="w-5 h-5 mr-2" /><span className="hidden sm:inline">Review Again</span><span className="sm:hidden">Review</span>
        </Button>
        <Button onClick={handleKnown} className="flex-1 h-11 sm:h-12 bg-success text-success-foreground hover:bg-success/90 min-h-[44px]">
          <Check className="w-5 h-5 mr-2" />Got It!
        </Button>
      </div>
    </motion.div>
  );
}

// Speed Challenge Game
function SpeedChallenge({ flashcards, onComplete }: { flashcards: Flashcard[]; onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentCard, setCurrentCard] = useState(flashcards[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [streak, setStreak] = useState(0);

  const generateOptions = useCallback(() => {
    const correct = currentCard.definition;
    const others = flashcards.filter((f) => f.id !== currentCard.id).sort(() => Math.random() - 0.5).slice(0, 3).map((f) => f.definition);
    return [correct, ...others].sort(() => Math.random() - 0.5);
  }, [currentCard, flashcards]);

  useEffect(() => { setOptions(generateOptions()); }, [currentCard, generateOptions]);
  useEffect(() => {
    if (timeLeft <= 0) { setIsGameOver(true); return; }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswer = (answer: string) => {
    if (answer === currentCard.definition) { setScore((s) => s + 10 + (timeLeft > 55 ? 5 : 0)); setStreak((s) => s + 1); }
    else { setScore((s) => Math.max(0, s - 5)); setStreak(0); }
    setCurrentCard(flashcards[Math.floor(Math.random() * flashcards.length)]);
  };

  if (isGameOver) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-elevated p-6 sm:p-8 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full gradient-bg-accent mx-auto mb-4 flex items-center justify-center glow-accent">
          <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Time's Up!</h2>
        <p className="text-3xl sm:text-4xl font-bold gradient-text-accent mb-2">{score}</p>
        <p className="text-muted-foreground mb-6">points scored</p>
        <Button onClick={onComplete} className="gradient-bg-primary text-primary-foreground min-h-[44px]">Back to Games</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          <span className={cn("text-xl sm:text-2xl font-bold", timeLeft <= 10 && "text-destructive animate-pulse")}>{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {streak >= 3 && <span className="text-xs sm:text-sm text-accent flex items-center gap-1"><Zap className="w-4 h-4" /> {streak} streak!</span>}
          <span className="text-xl sm:text-2xl font-bold gradient-text-primary">{score}</span>
        </div>
      </div>
      <Progress value={(timeLeft / 60) * 100} className="h-2" />
      <div className="glass-card p-6 sm:p-8 text-center">
        <span className="text-xs text-muted-foreground uppercase tracking-wide mb-4 block">What is the definition of:</span>
        <h3 className="text-xl sm:text-2xl font-bold gradient-text-primary mb-4 sm:mb-6">{currentCard.term}</h3>
      </div>
      <div className="grid gap-2 sm:gap-3">
        {options.map((option, index) => (
          <button key={index} onClick={() => handleAnswer(option)} className="glass-card p-3 sm:p-4 text-left hover:border-primary/50 transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[48px]">
            <span className="line-clamp-2 text-sm sm:text-base">{option}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// Memory Match Game
function MemoryMatch({ flashcards, onComplete }: { flashcards: Flashcard[]; onComplete: () => void }) {
  const [cards, setCards] = useState<Array<{ id: string; content: string; type: "term" | "def"; matched: boolean }>>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    const gameCards = flashcards.flatMap((f) => [
      { id: f.id, content: f.term, type: "term" as const, matched: false },
      { id: f.id, content: f.definition, type: "def" as const, matched: false },
    ]).sort(() => Math.random() - 0.5);
    setCards(gameCards);
  }, [flashcards]);

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || cards[index].matched) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].id === cards[second].id && cards[first].type !== cards[second].type) {
        setCards((prev) => prev.map((c, i) => i === first || i === second ? { ...c, matched: true } : c));
        setMatches((m) => m + 1);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  if (matches === flashcards.length) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-elevated p-6 sm:p-8 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success/20 mx-auto mb-4 flex items-center justify-center">
          <Grid3X3 className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Perfect Match!</h2>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">Completed in {moves} moves</p>
        <Button onClick={onComplete} className="gradient-bg-primary text-primary-foreground min-h-[44px]">Back to Games</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Moves: {moves}</span>
        <span className="text-muted-foreground">Matches: {matches}/{flashcards.length}</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
        {cards.map((card, index) => {
          const isFlippedCard = flipped.includes(index) || card.matched;
          return (
            <motion.button
              key={index}
              onClick={() => handleCardClick(index)}
              className={cn(
                "aspect-square rounded-lg p-2 text-xs transition-all min-h-[60px] sm:min-h-[80px]",
                isFlippedCard ? card.matched ? "bg-success/20 border border-success" : "glass-card" : "bg-muted hover:bg-muted/80"
              )}
              animate={{ rotateY: isFlippedCard ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {isFlippedCard && <span className="block overflow-hidden line-clamp-4 text-[10px] sm:text-xs">{card.content}</span>}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Quiz Battle Game
function QuizBattle({ flashcards, onComplete }: { flashcards: Flashcard[]; onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions = flashcards.slice(0, 10);
  const currentQuestion = questions[currentIndex];
  const isGameOver = lives <= 0 || currentIndex >= questions.length;

  const generateOptions = useCallback(() => {
    if (!currentQuestion) return [];
    const correct = currentQuestion.definition;
    const others = flashcards.filter((f) => f.id !== currentQuestion.id).sort(() => Math.random() - 0.5).slice(0, 3).map((f) => f.definition);
    return [correct, ...others].sort(() => Math.random() - 0.5);
  }, [currentQuestion, flashcards]);

  useEffect(() => { setOptions(generateOptions()); }, [currentIndex, generateOptions]);

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    if (answer === currentQuestion.definition) { setScore((s) => s + 10 + (streak >= 2 ? 2 : 0)); setStreak((s) => s + 1); }
    else { setLives((l) => l - 1); setStreak(0); }
  };

  const handleNext = () => { setCurrentIndex((i) => i + 1); setSelectedAnswer(null); setShowResult(false); };

  if (isGameOver) {
    const won = lives > 0;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-elevated p-6 sm:p-8 text-center">
        <div className={cn("w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-4 flex items-center justify-center", won ? "bg-success/20" : "bg-destructive/20")}>
          {won ? <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-success" /> : <Swords className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" />}
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">{won ? "Victory!" : "Game Over"}</h2>
        <p className="text-3xl sm:text-4xl font-bold gradient-text-primary mb-2">{score}</p>
        <p className="text-muted-foreground mb-6">points scored</p>
        <Button onClick={onComplete} className="gradient-bg-primary text-primary-foreground min-h-[44px]">Back to Games</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} className={cn("w-5 h-5 sm:w-6 sm:h-6", i < lives ? "text-destructive fill-destructive" : "text-muted-foreground")} />
          ))}
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground">Question {currentIndex + 1}/{questions.length}</span>
        <div className="flex items-center gap-2">
          {streak >= 3 && <span className="text-xs text-accent flex items-center gap-1"><Zap className="w-3 h-3" /> +2</span>}
          <span className="text-lg sm:text-xl font-bold gradient-text-primary">{score}</span>
        </div>
      </div>
      <Progress value={(currentIndex / questions.length) * 100} className="h-2" />
      <div className="glass-card p-5 sm:p-8 text-center">
        <span className="text-xs text-muted-foreground uppercase tracking-wide mb-4 block">Define:</span>
        <h3 className="text-xl sm:text-2xl font-bold gradient-text-primary">{currentQuestion.term}</h3>
      </div>
      <div className="grid gap-2 sm:gap-3">
        {options.map((option, index) => {
          const isCorrect = option === currentQuestion.definition;
          const isSelected = selectedAnswer === option;
          return (
            <button key={index} onClick={() => handleAnswer(option)} disabled={showResult}
              className={cn(
                "glass-card p-3 sm:p-4 text-left transition-all min-h-[48px]",
                !showResult && "hover:border-primary/50",
                showResult && isCorrect && "border-success bg-success/10",
                showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10"
              )}
            >
              <span className="line-clamp-2 text-sm sm:text-base">{option}</span>
            </button>
          );
        })}
      </div>
      {showResult && (
        <Button onClick={handleNext} className="w-full gradient-bg-primary text-primary-foreground min-h-[44px]">
          {currentIndex === questions.length - 1 ? "See Results" : "Next Question"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </motion.div>
  );
}

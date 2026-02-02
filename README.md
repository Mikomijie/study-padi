# 🧠 MindForge - Adaptive Learning Platform

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://mindforgee.lovable.app/)
[![Built with](https://img.shields.io/badge/built%20with-React-61dafb)](https://react.dev/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-purple)](https://lovable.dev/)

> An AI-powered adaptive learning platform that personalizes education based on student performance. Upload any document, and our AI breaks it into optimal learning chunks, adapts to your pace, and gamifies your learning journey.

## ✨ Features

### 🎯 Core Learning Experience
- **Smart Document Analysis**: Upload PDFs, DOCX, or TXT files - AI automatically sections and chunks content
- **Adaptive Learning Engine**: System dynamically adjusts content chunk sizes based on your test performance
  - Score ≥80%: Larger chunks (faster pace)
  - Score 60-79%: Same chunk size (steady pace)
  - Score <60%: Smaller chunks (focused learning)
- **Intelligent Testing**: Auto-generated quizzes after each section with instant feedback
- **Progress Tracking**: Comprehensive dashboard showing streaks, progress, and achievements

### 🎮 Gamification & Engagement
- **Daily Streak System**: Build learning streaks with visual calendar tracking
- **Achievement Badges**: Earn and download badges for milestones
  - 7-Day Streak (Week Warrior)
  - 30-Day Streak (Month Master)
  - 100-Day Streak (Century Champion)
  - First Section Complete
  - Course Complete
  - Perfect Score (100% on any test)
- **Flashcard Games**: 4 engaging game modes
  - 📇 Classic Flashcards - Traditional study mode
  - ⚡ Speed Challenge - 60-second rapid-fire quiz
  - 🎴 Memory Match - Match terms with definitions
  - ⚔️ Quiz Battle - Lives-based quiz competition

### 🧩 Personalized Learning
- **Difficulty Tracking**: Automatically identifies challenging terms from test performance
- **Spaced Repetition**: Smart reminders for difficult concepts at optimal intervals (Days 1, 3, 7, 14, 30)
- **Performance Analytics**: Detailed insights into learning patterns and progress
- **Custom Flashcards**: Auto-generated from difficult terms + manual creation

## 🚀 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI Framework** | Tailwind CSS, shadcn/ui components |
| **Backend** | Lovable Cloud (Supabase - PostgreSQL, Auth, Storage) |
| **AI/ML** | Lovable AI (document analysis, quiz generation) |
| **Visualization** | Recharts (progress charts) |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/mindforge.git
cd mindforge
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

## 🎮 How to Use

### For Students

1. **Sign Up**: Create an account with email and password
2. **Upload Material**: 
   - Go to Upload page
   - Drag and drop your study document (PDF, DOCX, TXT)
   - Wait for AI analysis
3. **Start Learning**: 
   - AI breaks content into sections and chunks
   - Read each chunk at your own pace
   - Track progress in real-time
4. **Take Tests**: 
   - Complete quiz after each section
   - Get immediate feedback
   - See which concepts need more work
5. **Adaptive Learning**:
   - System adjusts chunk sizes based on your performance
   - High scores → Bigger chunks (faster)
   - Low scores → Smaller chunks (more focused)
6. **Build Your Streak**: 
   - Complete sections daily
   - Watch your streak grow
   - Earn achievement badges
7. **Master Difficult Terms**:
   - Review flagged concepts
   - Get timed reminders
   - Play flashcard games for practice

## 🗂️ Project Structure
```
mindforge/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   ├── layout/       # Layout components (Navbar, etc.)
│   │   └── ui/           # shadcn/ui components
│   ├── pages/            # Route pages (Dashboard, Upload, Learning, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── integrations/     # Backend integrations
│   └── App.tsx           # Main app component
├── public/               # Static assets
├── supabase/             # Database migrations and edge functions
└── README.md
```

## 👥 Team

Built with ❤️ by:
- **Mkingsofficial** - Lead Developer
- **creativedivine** - Developer
- **~Victoire** - Developer

## 🏆 Hackathon

Created for Hackathon - February 2026

## 🎨 Design Philosophy

MindForge uses a calming, academic color palette inspired by nature:
- Soft sage greens for focus and growth
- Warm neutral backgrounds for comfort
- Clear contrast for readability
- Consistent spacing and typography for clarity

### Color Palette

**Light Mode:**
- Page Background: `#F6F4EF` (Mist Sand)
- Cards/Sections: `#FFFFFF` (Pure Linen)
- Primary Text: `#1C2A24` (Ink Green-Black)
- Secondary Text: `#6E7F76` (Olive Ash)
- Primary Accent: `#3A6B5A` (Deep Sage)
- Hover/Active: `#2F5B4C` (Forest Teal)

**Dark Mode:**
- Page Background: `#0D1B17` (Midnight Pine)
- Cards/Sections: `#152823` (Deep Moss)
- Primary Text: `#F4F7F5` (Ivory Smoke)
- Secondary Text: `#A7B8B1` (Soft Lichen)
- Primary Accent: `#6BC2A4` (Muted Mint)
- Hover/Active: `#8ADBC0` (Fresh Jade)

**Supporting Accents:**
- Progress/Success: `#7BC96F` (Natural Green)
- Focus/Info: `#C4A86F` (Warm Gold)
- Error: `#C65D4E` (Soft Red)

## 🔒 Privacy & Security

- User data is encrypted at rest
- Row-level security on all database tables
- Secure authentication via Lovable Cloud
- No data sharing with third parties

## 📈 Future Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Collaborative study groups
- [ ] Video content support
- [ ] Voice-based learning
- [ ] Multi-language support
- [ ] Instructor dashboard
- [ ] Real-time collaboration
- [ ] Advanced analytics

## 🐛 Known Issues

- Large files (>10MB) may take longer to process
- PDF processing works best with text-based PDFs (not scanned images)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For questions or issues:
- Open a GitHub issue
- Demo: [https://mindforgee.lovable.app/](https://mindforgee.lovable.app/)

---

**Made with 🧠 and ⚡ by the MindForge Team**

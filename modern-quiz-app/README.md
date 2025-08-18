# AZ-204 Modern Quiz App

A modern, responsive quiz application for practicing Azure Developer Associate (AZ-204) certification questions.

## Features

- 🎯 **Topic-based Practice**: Filter questions by Azure service topics
- 🌓 **Dark/Light Mode**: Automatic theme switching
- 📊 **Progress Tracking**: Track your learning progress and accuracy
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 💾 **Progress Persistence**: Your progress is saved locally
- 🎨 **Modern UI**: Built with Tailwind CSS and Framer Motion
- ⚡ **Fast Performance**: Optimized Next.js application

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd modern-quiz-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate quiz data from your question bank:**
   ```bash
   npm run seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser and visit:**
   ```
   http://localhost:3000
   ```

### Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

### Deployment

This app is configured for static export and can be deployed to:
- Vercel
- Netlify 
- GitHub Pages
- Any static hosting service

For GitHub Pages deployment, the app is pre-configured with the correct base path.

## Question Format

The app automatically parses your existing question bank from the `../Questions/` directory. Questions should be in markdown format with this structure:

```markdown
Question: Your question text here?

- [ ] Option A
- [x] Correct Option B  
- [ ] Option C
- [x] Another correct option (for multiple choice)

Answer: Explanation of the correct answer.

---
```

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Theme**: next-themes
- **Markdown**: react-markdown

## Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── ...             # Feature components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
├── data/               # Generated quiz data (JSON)
└── styles/             # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Please respect Microsoft's intellectual property when using actual exam questions.

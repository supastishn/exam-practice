# AI-Powered Learning & Practice Tools

A versatile collection of interactive tools designed to assist with learning, practice, and creativity, powered by generative AI. This application is built with React and Vite, and it offers a wide range of modules for various tasks, from educational exercises to professional assistance.

**[Live Demo](https://supastishn.github.io/exam-practice/)**

## Features

This application includes a portal with numerous specialized tools, including:

### Educational & Practice Tools
- **Language Exercise Generator**: Creates custom English and Math exercises (multiple-choice, fill-in-the-blank).
- **Memorization Quiz Generator**: Turns any text into a quiz to aid memorization.
- **Question Tutor**: A Socratic-style tutor that asks questions to deepen your understanding of a topic.
- **Flashcard Converter**: Automatically creates flashcards from your notes.
- **Translation Practice**: Provides a platform to practice translating text and get AI feedback.

### Writing & Communication
- **Writing Collaborator**: Get feedback and suggested revisions on your writing.
- **Resume & Cover Letter Assistant**: Analyzes your resume against a job description and gives feedback.
- **Tone Adjuster**: Rewrites your text to fit a specific tone (e.g., formal, casual, persuasive).
- **Satire & Parody Generator**: Converts ordinary text into a satirical piece.
- **Argument Builder**: Helps brainstorm, structure, and refine arguments for a thesis.
- **Summarizers**: Tools to summarize complex legal documents and scientific papers.

### Logic & Simulation
- **Debate Mode**: Practice debating against an AI on any topic.
- **Fallacy Detector**: Analyzes text to identify logical fallacies and cognitive biases.
- **Ethical Dilemma Simulator**: Explore classic ethical problems and get a philosophical analysis of your decision.
- **Historical "What If" Scenarios**: Explore alternate history timelines based on a point of divergence.
- **Negotiation Practice**: Simulate a negotiation with an AI partner and get feedback.
- **Conversation Simulator**: Practice conversations for specific scenarios (e.g., job interviews).
- **Decision-Making Matrix**: A non-AI tool to help you make decisions by weighing options against criteria.

### Technical & Development
- **Algorithm Explainer**: Explains how a given code snippet or algorithm works, including its complexity.
- **Regex Builder**: Generates regular expressions from a plain English description.
- **Bug Report Formatter**: Converts a simple bug description into a structured, professional bug report.
- **Math Proof Assistant**: Provides step-by-step proofs for mathematical claims.

## Technology Stack

- **Frontend**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Markdown Rendering**: [React-Markdown](https://github.com/remarkjs/react-markdown) with plugins for math/LaTeX.
- **Styling**: Plain CSS with CSS Variables for theming (Light/Dark mode).
- **Testing**: [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

## Getting Started

To run this project locally, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or later)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/supastishn/exam-practice.git
    cd exam-practice
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173/exam-practice/`.

### Configuration

This application requires an AI backend to function. You have two options, which can be configured in the **Settings** page (`/settings`) of the running application:

1.  **AI Hack Club (Default, Free)**: A free, community-run endpoint. No API key is needed. This is a great way to test the application without any setup. Note that it may have rate limits.
2.  **Custom API Key**: Use your own API key for any OpenAI-compatible service. You can provide your API Key, a custom Base URL (for proxies or alternative providers), and a default model name.

## Contributing

Contributions are welcome! Whether it's reporting a bug, suggesting a new feature, or submitting a pull request, your help is appreciated. Please read the [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for more details.

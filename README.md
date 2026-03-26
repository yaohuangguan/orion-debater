# Orion AI Debater 🎙️

Orion AI Debater is a dynamic, multi-modal debate simulator powered by Gemini. Experience intense clashes of ideas with distinct AI personas, real-time speech synthesis, and live audience reactions.

## 🚀 Features

- **Dynamic Persona Generation**: Instantly create two diametrically opposed personas based on any topic.
- **Real-time Debate Loop**: Watch as AI debaters engage in a sharp, witty, and persuasive exchange of ideas.
- **Multimodal Experience**: 
  - **Text**: Beautifully formatted chat interface.
  - **Speech**: Live voice synthesis for both participants (Powered by Gemini TTS).
- **Interactive Elements**:
  - **Live Voting**: Influence the debate by voting for Side A or Side B.
  - **Audience Reactions**: Dynamic commentary and reactions from a virtual crowd.
- **Judge Evaluation**: Get a professional breakdown of the debate with logic, evidence, and novelty scores.
- **Wildcard Mode**: Inject random constraints (e.g., "Speak like a pirate") to keep debaters on their toes.

## 🛠️ Architecture

The project has been migrated to a secure backend architecture:
- **Frontend**: React + Vite + Tailwind CSS.
- **Backend**: Express.js (Node.js) handling all AI processing and API key management.
- **Authentication**: JWT-based user authentication.

## 🏃 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yaohuangguan/orion-debater.git
    cd orion-debater
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the application**:
    ```bash
    npm run dev
    ```

4.  **Open your browser**:
    Navigate to `http://localhost:5173`.

## 🔒 Authentication

This application requires user login for extended use. Guests have a limited number of turns before being prompted to sign in or register.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

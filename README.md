# English Exercises Generator

A frontend-only web application that uses OpenAI's API to generate English language exercises based on user prompts.

## Project Overview
This application allows users to input their OpenAI API credentials, which are stored securely in the browser's local storage (encrypted). Users can then specify parameters for English language exercises (e.g., type, difficulty, topic) and generate them using the OpenAI API.

## Features
(Refer to PLAN.md for a full list of planned features)

- Secure API credential storage (encrypted in LocalStorage)
- Exercise generation based on user prompts
- Selection of exercise type, difficulty, and topic
- Display of generated exercises
- Copy to clipboard and print functionality (basic)

## File Structure
```
/
├── index.html          # Main entry point
├── css/
│   ├── styles.css      # Main styles
│   └── themes.css      # Theme-specific styles
├── js/
│   ├── main.js         # Application initialization
│   ├── api.js          # OpenAI API interaction
│   ├── exercises.js    # Exercise generation and handling
│   ├── ui.js           # UI manipulation
│   ├── auth.js         # Credential management
│   └── utils.js        # Helper functions
├── assets/             # For icons, images (not populated yet)
│   ├── icons/
│   └── images/
├── PLAN.md             # Detailed project plan
└── README.md           # This file
```

## Setup
1. Clone the repository (if applicable) or download the files.
2. Open `index.html` in a modern web browser.
3. Enter your OpenAI API key (and optionally a base URL) in the setup section.
4. Start generating exercises.

## Security Note
The OpenAI API key is encrypted and stored in your browser's LocalStorage. While this provides a basic level of security for client-side storage, be mindful of the risks of storing sensitive credentials in the browser. The encryption key used is hardcoded in `js/auth.js`; for enhanced security in a real-world scenario, managing this key would require a more robust solution.

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6+)
- CryptoJS (for encrypting API key in LocalStorage)
- Fetch API (for OpenAI requests)

## How to Use
1. Open `index.html`.
2. Provide your OpenAI API key.
3. Fill in the exercise generation form.
4. Click "Generate Exercise".
5. The generated exercise will appear below.

This project is based on the plan outlined in `PLAN.md`.

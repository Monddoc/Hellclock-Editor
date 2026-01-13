# 🌌 Hell Clock Editor

> A save file editor for **Hell Clock**.

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web-blue)

The **Hell Clock Editor** is a client-side web tool designed to help players manage their *Hell Clock* save files (`PlayerSave0.json`). Built with a focus on user experience (UX) and data integrity, it allows for easy modification of currencies, materials, and shrine unlocks without the risk of file corruption.

---

## ✨ Features

### 🎮 Game Features
- **Resources:** Edit **Soulstones** and **Constellation Points**.
- **Crafting Materials:** Visual interface for all tools (Tinkering, Fury, Faith, etc.) with icons.
- **Cursed Shrines:** - Automatically calculates which shrines are missing by Floor Number.
- **"Complete All"** button to instantly collect all missing shrines in a dungeon.
- **Campaign Status:** Visual indicator for game completion status.

### 🎨 Modern UI/UX
- **Drag & Drop:** Upload files simply by dragging them onto the interface.
- **Path Helper:** One-click copy for the save file directory (`%USERPROFILE%...`).
- **Responsive Design:** Dark mode interface with glassmorphism effects and grid layouts.

### 🛡️ Secure & Robust
- **Client-Side Only:** No data is ever sent to a server. All processing happens in your browser.
- **Strict Validation:** Input "Gatekeepers" block non-numeric characters, symbols, and negative numbers to prevent save file corruption.
- **XSS Protection:** DOM manipulation uses `textContent` and `createElement` to ensure malicious save files cannot execute scripts.


---

## 🚀 How to Use

1.  **Backup your save file!** Always make a copy of your `.json` file before editing
2.  Open the **Hell Clock Editor**
3.  Click the **Copy Path** button to get the save location:
    ```
    %USERPROFILE%\AppData\LocalLow\Rogue Snail\Hell Clock
    ```
4.  Paste that path into your File Explorer address bar
5.  Drag and drop **`PlayerSave0.json`** into the editor
6.  Modify your resources or complete your shrines
7.  Click **"Download Modified Save"**
8.  Replace the original file in the folder with the downloaded one

---

## 🏗️ Architecture

This project is built using a strict **Model-View-Controller (MVC)** pattern in Vanilla JavaScript (ES6 Modules).

* **Model (`model.js`):** Manages the data state, business logic, and JSON parsing. It knows *what* the data is but not *how* to display it.
* **View (`view.js`):** Handles the DOM. It receives data from the Model and renders the UI. It contains no business logic.
* **Controller (`controller.js`):** The brain. It handles user events (clicks, inputs, drops), updates the Model, and triggers View refreshes.

---

## 🛠️ Installation & Development

To run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Monddoc/Hellclock-Editor.git
    cd hell-clock-editor
    ```

2.  **Directory Structure:**
    Ensure your folders look like this:
    ```text
    /
    ├── index.html
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── controller.js
    │   ├── model.js
    │   └── view.js
    └── icons/
        ├── IconTool_Tinkering.png
        └── ... (other assets)
    ```

3.  **Run a Local Server:**
    Because the project uses ES6 Modules (`type="module"`), you cannot simply open `index.html` in a browser due to CORS policies. You must use a local server.
    
    * **VS Code:** Install the "Live Server" extension and click "Go Live".
    * **Python:** `python -m http.server 8000`
    * **Node:** `npx serve`

---

## 📜 Disclaimer

This tool is not affiliated with **Rogue Snail** or **Astral Ascent**. It is a community-made tool. Use at your own risk.

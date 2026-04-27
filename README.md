# ResumeAI-Pro

**ResumeIQ-Pro** is a high-performance desktop application designed to streamline the recruitment pipeline through automated, intelligent resume parsing. Built on a robust **Python-based web server architecture** and wrapped in a **PyQt6** desktop shell, the system eliminates manual screening fatigue by mathematically aligning candidate profiles with specific job descriptions and core competencies.

---

## 🚀 Key Features

* **Precision Keyword Mapping:** Employs advanced string-matching and natural language filtering to identify the exact intersection between job requirements and candidate expertise.
* **Automated Directory Management:** Features a "Zero-Touch" file handling system that autonomously creates directory structures and migrates shortlisted candidates to dedicated folders.
* **Hybrid Architecture:** Combines the flexibility of a **Flask** web backend with the stability of a **PyQt6** Windows desktop environment.
* **Secure Local Processing:** Runs as a local server (`127.0.0.1:8080`) to ensure sensitive candidate data stays on your machine, avoiding the privacy risks of third-party cloud services.
* **Zero-Flicker UI:** Implements hardware-accelerated rendering using **Desktop OpenGL** for a smooth, premium user experience.

---

## 🛠️ Technical Stack

* **Frontend Shell:** PyQt6 & QWebEngine
* **Backend Server:** Flask
* **Document Parsing:** `pdfplumber`, `python-docx`, and `PyMuPDF`
* **Data Science:** `pandas`, `numpy`, and `scikit-learn` for candidate ranking
* **Packaging:** PyInstaller

---

## 📂 Project Structure

```text
ResumeIQ-Pro/
├── backend/            # Flask API and screening logic
├── frontend/           # Web-based UI components
├── launcher.py         # Main entry point (Flask + PyQt6 integration)
├── ResumeIQ_App.spec   # PyInstaller build configuration
├── requirements.txt    # Project dependencies
└── .gitignore          # Git exclusion rules
```

---



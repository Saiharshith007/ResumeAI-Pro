import sys
import os
import threading
import time

# --- Explicitly import backend dependencies to force PyInstaller to bundle them ---
import flask
import pdfplumber
import docx
import werkzeug
# --------------------------------------------------------------------------------

# Ensure paths are handled correctly for PyInstaller bundled app
if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS
else:
    base_dir = os.path.dirname(os.path.abspath(__file__))

sys.path.append(os.path.join(base_dir, 'backend'))
from backend.app import app

def start_server():
    # Run the flask app locally
    app.run(host='127.0.0.1', port=8080, debug=False, use_reloader=False)

if __name__ == '__main__':
    # Start Flask server in a daemon thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait a tiny bit for the server to spin up
    time.sleep(1.5)

    from PyQt6.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QFileDialog
    from PyQt6.QtWebEngineWidgets import QWebEngineView
    from PyQt6.QtWebEngineCore import QWebEngineProfile, QWebEnginePage, QWebEngineSettings
    from PyQt6.QtCore import QUrl, Qt, QTimer
    
    class ResumeWindow(QMainWindow):
        def __init__(self):
            super().__init__()
            self.setWindowTitle("Resume Intelligence - Preview")
            self.resize(1100, 900)
            self.setAttribute(Qt.WidgetAttribute.WA_DeleteOnClose)
            self.view = QWebEngineView()
            self.setCentralWidget(self.view)
            settings = self.view.settings()
            settings.setAttribute(QWebEngineSettings.WebAttribute.PdfViewerEnabled, True)
            settings.setAttribute(QWebEngineSettings.WebAttribute.PluginsEnabled, True)

    class WebPage(QWebEnginePage):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.external_windows = []

        def createWindow(self, _type):
            new_win = ResumeWindow()
            self.external_windows.append(new_win)
            new_win.show()
            return new_win.view.page()

    def handle_download(download_item):
        # Automatically save to the standard OS Downloads folder
        downloads_path = os.path.join(os.path.expanduser('~'), 'Downloads')
        if not os.path.exists(downloads_path):
            os.makedirs(downloads_path, exist_ok=True)
            
        target_path = os.path.join(downloads_path, download_item.suggestedFileName())
        download_item.setDownloadDirectory(downloads_path)
        download_item.setDownloadFileName(download_item.suggestedFileName())
        download_item.accept()
        print(f"--- Download Started: {target_path} ---")

    # Set some Qt Flags to reduce flickering on Windows
    os.environ["QT_ENABLE_HIGHDPI_SCALING"] = "1"
    
    # Force stable rendering on Windows to prevent flickering
    QApplication.setAttribute(Qt.ApplicationAttribute.AA_UseDesktopOpenGL)
    QApplication.setAttribute(Qt.ApplicationAttribute.AA_ShareOpenGLContexts)
    
    qt_app = QApplication(sys.argv)
    window = QMainWindow()
    window.setWindowTitle("Marvel Geospatial - Resume Screener")
    window.resize(1200, 850)
    
    # Solid background for the entire window
    window.setStyleSheet("QMainWindow, QWidget#CentralWidget { background-color: #030407; }")

    web_view = QWebEngineView()
    web_view.setStyleSheet("background-color: #030407;")
    page = WebPage(web_view)
    
    # Set the actual theme background color directly on the WebEngine page
    from PyQt6.QtGui import QColor
    page.setBackgroundColor(QColor("#030407"))
    web_view.setPage(page)
    
    settings = web_view.settings()
    settings.setAttribute(QWebEngineSettings.WebAttribute.PluginsEnabled, True)
    settings.setAttribute(QWebEngineSettings.WebAttribute.PdfViewerEnabled, True)
    settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptCanOpenWindows, True)
    
    profile = web_view.page().profile()
    profile.downloadRequested.connect(handle_download)
    
    web_view.load(QUrl("http://127.0.0.1:8080"))

    central_widget = QWidget()
    central_widget.setObjectName("CentralWidget")
    layout = QVBoxLayout()
    layout.setContentsMargins(0, 0, 0, 0)
    layout.addWidget(web_view)
    central_widget.setLayout(layout)
    
    window.setCentralWidget(central_widget)
    
    # Delayed show to ensure zero-flicker start
    QTimer.singleShot(1000, window.show)

    sys.exit(qt_app.exec())

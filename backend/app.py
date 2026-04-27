import os
from flask import Flask, request, jsonify, send_file

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'POST,GET,PUT,DELETE,OPTIONS'
    return response

from ai_screener import screen_resumes

import sys

if getattr(sys, 'frozen', False):
    # PyInstaller bundled location
    BASE_DIR = sys._MEIPASS
    FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
    UPLOAD_FOLDER = os.path.join(os.path.dirname(sys.executable), 'uploads')
else:
    # Development location
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '../frontend'))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
app.after_request(add_cors_headers)

@app.route('/')
def index():
    return app.send_static_file('login.html')

@app.route('/index.html')
def index_html():
    return app.send_static_file('index.html')

@app.route('/browse', methods=['GET'])
def browse_folder():
    import tkinter as tk
    from tkinter import filedialog
    try:
        root = tk.Tk()
        root.withdraw() 
        root.attributes('-topmost', True) 
        folder_path = filedialog.askdirectory(parent=root, title="Select Resume Folder")
        root.destroy()
        return jsonify({'path': folder_path})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'resumes' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400
    
    files = request.files.getlist('resumes')
    for file in files:
        if file.filename: file.save(os.path.join(UPLOAD_FOLDER, file.filename))
        
    return jsonify({'status': 'success', 'message': 'File(s) uploaded successfully.'}), 200

@app.route('/file', methods=['GET'])
def serve_resume_file():
    file_path = request.args.get('path')
    download = request.args.get('download', 'false').lower() == 'true'
    
    if file_path and os.path.exists(file_path):
        return send_file(file_path, as_attachment=download)
    return "File not found.", 404

@app.route('/process', methods=['POST'])
def process_resumes():
    data = request.json
    if not data: return jsonify({'status': 'error', 'message': 'No data received.'}), 400
    
    jd = data.get('jd')
    keywords = data.get('keywords', [])
    skills = data.get('skills', []) 
    file_list = data.get('files')
    
    # 1. FIX: Catch the threshold from the slider (defaults to 30 if not found)
    threshold = int(data.get('threshold', 30))
    
    print(f"--- SCREENING STARTED | Threshold set to: {threshold}% ---")

    try:
        # 2. FIX: Pass the 'threshold' variable into the screen_resumes function
        results = screen_resumes(jd, keywords, skills, file_list, UPLOAD_FOLDER, threshold)
        return jsonify({'status': 'success', 'processed_resumes': results}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
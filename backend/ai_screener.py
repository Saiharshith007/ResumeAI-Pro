import os
import shutil
import pdfplumber
import docx
import re

def get_text_from_file(file_path):
    name, ext = os.path.splitext(file_path)
    ext = ext.lower()
    text = ""
    try:
        if ext == ".txt":
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        elif ext == ".pdf":
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted: text += extracted + "\n"
        elif ext == ".docx":
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
    return text

def extract_experience(text):
    # 1. Flatten all newlines and multiple spaces into a single space so PDF line-breaks don't ruin the search
    text_clean = re.sub(r'\s+', ' ', text.lower())
    
    # 2. Search for explicit phrases indicating total experience
    explicit_patterns = [
        # Matches: "24 years of career progression", "5+ yrs of total experience", "10 years experience"
        r'\b(\d{1,2})\s*\+?\s*(?:years|yrs)\s+(?:of\s+)?(?:overall\s+|total\s+)?(?:career\s+progression|experience|exp|professional\s+experience)\b',
        
        # Matches: "with 24 years of...", "over 10 years of professional..."
        r'(?:with|over|having)\s+(\d{1,2})\s*\+?\s*(?:years|yrs)\s+(?:of\s+)?(?:experience|exp|career|professional)',

        # Matches: "Total Experience: 5", "Experience - 5 years", "Overall exp 5"
        r'(?:overall|total)?\s*(?:career\s+progression|experience|exp)\s*[:\-]?\s*(\d{1,2})\s*\+?\s*(?:years|yrs)?'
    ]
    
    for p in explicit_patterns:
        match = re.search(p, text_clean)
        if match:
            return f"{match.group(1)}+ Years"

    # 3. Fallback: If no explicit total is found, find all mentioned years, ignoring age.
    pattern = r'\b(\d{1,2})\s*\+?\s*(?:years|yrs)\b(?!\s*old|\s*of\s*age)'
    matches = re.findall(pattern, text_clean)
    
    if matches:
        years_list = [int(m) for m in matches if int(m) < 50]
        if years_list:
            # Safest fallback: take the highest single block of years mentioned.
            # (No more adding 24 + 20 to get 44!)
            return f"{max(years_list)}+ Years"
            
    return "Not specified"

# FIX IS HERE: Added 'threshold=30' as the 6th argument
def screen_resumes(job_description, keywords, skills, resume_items, upload_folder, threshold=30):
    processed_resumes = []
    downloads_dir = os.path.join(os.path.expanduser('~'), 'Downloads', 'Shortlisted_Resumes')
    os.makedirs(downloads_dir, exist_ok=True)
    
    actual_files = []
    for item in resume_items:
        if os.path.isabs(item):
            if os.path.isdir(item):
                for root, _, files in os.walk(item):
                    for f in files:
                        if f.lower().endswith(('.pdf', '.docx', '.txt')):
                            actual_files.append((os.path.join(root, f), f))
            elif os.path.isfile(item):
                actual_files.append((item, os.path.basename(item)))
        else:
            actual_files.append((os.path.join(upload_folder, item), item))
    
    for file_path, file_name in actual_files:
        raw_text = get_text_from_file(file_path)
        text_lower = raw_text.lower()
        
        # 1. Match Keywords & Skills
        matched_keywords = [kw for kw in keywords if kw.lower() in text_lower]
        matched_skills = [sk for sk in skills if sk.lower() in text_lower]
        
        kw_pct = (len(matched_keywords) / len(keywords)) * 100 if keywords else 0
        sk_pct = (len(matched_skills) / len(skills)) * 100 if skills else 0
        
        # 2. Match Job Description (Semantic Overlap)
        jd_score = 0
        if job_description:
            jd_words = set(re.findall(r'\b[a-z]{4,}\b', job_description.lower()))
            resume_words = set(re.findall(r'\b[a-z]{4,}\b', text_lower))
            if jd_words:
                common_words = jd_words.intersection(resume_words)
                jd_score = int((len(common_words) / len(jd_words)) * 100)

        # 3. Calculate Overall Score dynamically
        active_scores = []
        if keywords: active_scores.append(kw_pct)
        if skills: active_scores.append(sk_pct)
        if job_description: active_scores.append(jd_score)
        
        overall_score = int(sum(active_scores) / len(active_scores)) if active_scores else 0
        experience_display = extract_experience(raw_text)
        
        # 4. Strict Threshold Check using the slider number
        is_shortlisted = overall_score >= int(threshold)

        if is_shortlisted:
            try:
                shutil.copy(file_path, os.path.join(downloads_dir, file_name))
            except: pass

        processed_resumes.append({
            "name": file_name,
            "file_path": file_path,
            "format": os.path.splitext(file_name)[1][1:].upper(),
            "score": overall_score, 
            "semantic_score": jd_score,
            "keywords_matched": matched_keywords,
            "keyword_match_count": len(matched_keywords),
            "keywords_searched": len(keywords),
            "skills_matched": matched_skills,
            "skills_score": int(sk_pct),
            "shortlisted": is_shortlisted,
            "experience_years": experience_display,
        })
        
    return processed_resumes
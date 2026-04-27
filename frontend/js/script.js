lucide.createIcons();
let uploadedFileNames = [];
let currentResumesData = []; 

// --- SESSION & PROFILE DROP-DOWN ---
const sessionUser = localStorage.getItem('resumeiq_user') || 'Admin';
document.getElementById('profileName').innerText = sessionUser;

const profileBtn = document.getElementById('profileDropdownBtn');
const profileDropdown = document.getElementById('profileDropdown');
const logoutModal = document.getElementById('logoutModal');

// Push a dummy state to history to detect back button
window.history.pushState(null, "", window.location.href);
window.onpopstate = function() {
    // When back is pressed, popstate triggers.
    // We show the modal and push the state back so they don't actually leave.
    showLogoutModal();
    window.history.pushState(null, "", window.location.href);
};

function showLogoutModal() {
    logoutModal.style.display = 'flex';
    lucide.createIcons({ proxy: logoutModal });
}

window.closeLogoutModal = function() {
    logoutModal.style.display = 'none';
}

window.proceedLogout = function() {
    localStorage.removeItem('resumeiq_user');
    window.location.href = 'login.html';
}

profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (profileDropdown.style.display === 'none' || profileDropdown.style.opacity === '0') {
        profileDropdown.style.display = 'block';
        setTimeout(() => {
            profileDropdown.style.opacity = '1';
            profileDropdown.style.transform = 'translateY(0)';
        }, 10);
        profileBtn.style.background = 'rgba(99, 102, 241, 0.2)';
    } else {
        closeProfileDropdown();
    }
});

function closeProfileDropdown() {
    profileDropdown.style.opacity = '0';
    profileDropdown.style.transform = 'translateY(-10px)';
    profileBtn.style.background = '';
    setTimeout(() => {
        profileDropdown.style.display = 'none';
    }, 300);
}

document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
        closeProfileDropdown();
    }
});

window.logoutSession = function() {
    showLogoutModal();
}; 

// --- THRESHOLD SLIDER LOGIC ---
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdValue = document.getElementById('thresholdValue');

thresholdSlider.addEventListener('input', function() {
    thresholdValue.innerText = this.value + '%';
});

// --- TAG LOGIC (Keywords & Skills) ---
function createTag(containerId, inputId, label) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.setAttribute('class', 'tag');
    
    const span = document.createElement('span');
    span.innerHTML = label;
    span.style.cursor = 'pointer';
    span.onclick = () => {
        document.getElementById(inputId).value = label;
        div.remove();
        document.getElementById(inputId).focus();
    };
    
    const closeIcon = document.createElement('i');
    closeIcon.setAttribute('data-lucide', 'x');
    closeIcon.onclick = (e) => { e.stopPropagation(); div.remove(); };
    
    div.appendChild(span);
    div.appendChild(closeIcon);
    container.insertBefore(div, document.getElementById(inputId));
    lucide.createIcons({ proxy: div });
}

const setupInput = (inputId, containerId) => {
    document.getElementById(inputId).addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            let tagValue = this.value.trim().replace(/,/g, '');
            if (tagValue.length > 0) {
                createTag(containerId, inputId, tagValue);
                this.value = '';
            }
        }
    });
};

setupInput('keywordInput', 'keywordsInputArea');
setupInput('skillInput', 'skillsInputArea');

// --- WORD & CHARACTER COUNT ---
const jobDescription = document.getElementById('jobDescription');
const updateCounts = () => {
    const text = jobDescription.value.trim();
    const wordCount = text.length > 0 ? text.split(/\s+/).length : 0;
    document.querySelector('.char-count').innerText = `${wordCount} words | ${jobDescription.value.length} characters`;
};
if (jobDescription) { jobDescription.addEventListener('input', updateCounts); updateCounts(); }

// (Browse PC button removed)

const addLocalPath = async () => {
    const val = document.getElementById('pathInput').value.trim();
    if (val) {
        // Use typed path
        if (!uploadedFileNames.includes(val)) {
            uploadedFileNames.push(val);
            renderFileList();
            document.getElementById('pathInput').value = '';
        }
    } else {
        // If empty, trigger the backend OS Folder Picker dialog
        try {
            const btn = document.getElementById('addPathBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader"></i> Opening Picker...';
            lucide.createIcons();
            
            const response = await fetch('http://127.0.0.1:8080/browse');
            const data = await response.json();
            
            if (data.path && !uploadedFileNames.includes(data.path)) {
                document.getElementById('pathInput').value = data.path;
                uploadedFileNames.push(data.path);
                renderFileList();
                // Optionally clear it right after visually confirming
                setTimeout(() => { document.getElementById('pathInput').value = ''; }, 1000);
            }
            btn.innerHTML = originalText;
            lucide.createIcons();
        } catch (err) {
            alert('Cannot open OS Folder Picker. Is the Python backend server running?');
            document.getElementById('addPathBtn').innerHTML = '<i data-lucide="plus"></i> Add Path';
            lucide.createIcons();
        }
    }
};

document.getElementById('addPathBtn').onclick = addLocalPath;
document.getElementById('pathInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addLocalPath(); }
});

// --- RENDER FILE LIST WITH CLEAR ALL ---
function renderFileList() {
    const area = document.getElementById('fileListArea');
    if (uploadedFileNames.length === 0) {
        area.style.display = 'none';
        return;
    }
    
    area.style.display = 'block';
    area.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--border);">
            <span style="color: var(--text-main); font-weight: 700; font-size: 0.9rem;">
                <i data-lucide="layers" style="width:16px; vertical-align:middle; margin-right:5px;"></i> 
                ${uploadedFileNames.length} Source(s) Loaded
            </span>
            <button type="button" onclick="clearAllFiles()" style="background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.2); padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.3s;">
                <i data-lucide="trash-2" style="width:14px;"></i> Clear All
            </button>
        </div>
        <div class="file-scroll-area" style="max-height: 200px; overflow-y: auto;">
            ${uploadedFileNames.map(f => {
                const isPath = f.includes(':') || f.includes('\\');
                return `
                <div class="file-item" style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 8px; border: 1px solid transparent;">
                    <i data-lucide="${isPath ? 'folder' : 'file'}" style="width:16px; color: ${isPath ? 'var(--accent-purple)' : 'var(--text-dim)'};"></i>
                    <span style="font-size: 0.85rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${f}</span>
                </div>`;
            }).join('')}
        </div>
    `;
    lucide.createIcons();
}

window.clearAllFiles = () => { uploadedFileNames = []; renderFileList(); };

// --- START SCREENING WITH PROGRESS ---
document.getElementById('startScreeningBtn').onclick = async function() {
    // 1. FORCE THE SCRIPT TO GRAB THE CURRENT SLIDER NUMBER
    const sliderElement = document.getElementById('thresholdSlider');
    const threshold = parseInt(sliderElement.value);

    const jd = jobDescription ? jobDescription.value.trim() : "";
    const keywordTags = [...document.querySelectorAll('#keywordsInputArea .tag span')].map(s => s.innerText);
    const skillTags = [...document.querySelectorAll('#skillsInputArea .tag span')].map(s => s.innerText);
    
    if (!jd && keywordTags.length === 0 && skillTags.length === 0) {
        alert('Please provide Job Description, Keywords, or Skills.');
        return;
    }

    if (uploadedFileNames.length === 0) {
        alert('Please add at least one Resume or Path.');
        return;
    }

    const progressContainer = document.getElementById('screeningProgressContainer');
    const progressBar = document.getElementById('screeningProgressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressStatus = document.getElementById('progressStatus');

    this.disabled = true;
    progressContainer.style.display = 'block';
    document.getElementById('resultsDashboard').style.display = 'none';

    let currentProgress = 0;
    const updateBar = (target, text) => {
        currentProgress = target;
        progressBar.style.width = `${target}%`;
        progressPercent.innerText = `${target}%`;
        if (text) progressStatus.innerText = text;
    };

    updateBar(10, "Extracting text...");

    try {
        const res = await fetch('http://127.0.0.1:8080/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jd, keywords: keywordTags, skills: skillTags, files: uploadedFileNames, threshold: threshold })
        });
        
        updateBar(60, "Matching criteria...");
        const result = await res.json();
        
        if (result.status === 'success') {
            updateBar(100, "Screening Complete!");
            setTimeout(() => {
                showResults(result.processed_resumes);
                this.disabled = false;
                progressContainer.style.display = 'none';
            }, 800);
        } else {
            // FIX: If Python crashes, stop the loading bar and show the error!
            alert("Backend Error: " + result.message);
            this.disabled = false;
            progressContainer.style.display = 'none';
        }
    } catch (err) {
        alert("Server connection failed! Check if Python is running.");
        this.disabled = false;
        progressContainer.style.display = 'none';
    }
};

// --- SHOW RESULTS ---
function showResults(resumes) {
    currentResumesData = resumes;
    document.getElementById('resultsDashboard').style.display = 'block';
    
    // Update top stat cards
    document.getElementById('totalProcessed').innerText = resumes.length;
    document.getElementById('totalShortlisted').innerText = resumes.filter(r => r.shortlisted).length;
    document.getElementById('averageScore').innerText = resumes.length > 0 ? Math.round(resumes.reduce((sum, r) => sum + r.score, 0) / resumes.length) + "%" : "0%";
    document.getElementById('topScore').innerText = resumes.length > 0 ? Math.max(...resumes.map(r => r.score)) + "%" : "0%";
    
    // Sort highest score first
    currentResumesData.sort((a, b) => b.score - a.score);
    
    // Render the table with ALL results initially
    renderTable(currentResumesData);
}

// --- RENDER TABLE LOGIC ---
function renderTable(resumesToRender) {
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = resumesToRender.map((r, i) => {
        const allMatches = [...r.keywords_matched, ...r.skills_matched];
        const matchedHTML = allMatches.map(item => `<span class="mini-tag">${item}</span>`).join('');
        
        const skHTML = r.skills_matched.map(s => 
            `<span class="mini-tag" style="background:rgba(76, 175, 80, 0.1); color:#4CAF50; border-color:rgba(76, 175, 80, 0.2);">${s}</span>`
        ).join('');

        const bgStyle = r.shortlisted ? 'background-color: rgba(76, 175, 80, 0.05);' : '';
        
        // Rank number turns green if shortlisted
        const rankStyle = r.shortlisted ? 'color: #4CAF50; font-weight: 800;' : 'color: var(--text-dim);';
        
        // Status Badge
        const statusBadge = r.shortlisted 
            ? `<span style="background: rgba(76,175,80,0.1); color: #4CAF50; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700;">Shortlisted</span>`
            : `<span style="background: rgba(255,255,255,0.05); color: var(--text-dim); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">Rejected</span>`;

        return `
        <tr style="${bgStyle}">
            <td style="${rankStyle}">#${i+1}</td>
            <td>${statusBadge}</td>
            <td>${r.name}</td>
            <td class="overall-cell" style="color: ${r.shortlisted ? '#4CAF50' : 'var(--text-main)'}; font-weight: 800;">${r.score}%</td> 
            <td>${r.semantic_score}%</td>
            <td>${r.keyword_match_count}/${r.keywords_searched}</td>
            <td><div class="matched-keywords">${matchedHTML || '<span style="color:var(--text-dim)">None</span>'}</div></td>
            <td>
                <div style="color:#4CAF50; font-weight:700; margin-bottom: 6px;">${r.skills_score}% Match</div>
                <div class="matched-keywords">${skHTML || '<span style="color:var(--text-dim)">None</span>'}</div>
            </td>
            <td>${r.experience_years}</td> 
            <td><span class="format-pill">${r.format}</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button class="details-btn" onclick="window.open('http://127.0.0.1:8080/file?path=${encodeURIComponent(r.file_path)}&download=false','_blank')">Details</button>
                     <i data-lucide="download" class="download-icon" style="cursor:pointer; width:16px; color:var(--text-dim);" onclick="const a=document.createElement('a');a.href='http://127.0.0.1:8080/file?path=${encodeURIComponent(r.file_path)}&download=true';document.body.appendChild(a);a.click();document.body.removeChild(a);"></i>
                </div>
            </td>
        </tr>`;
    }).join('');
    lucide.createIcons();
}

// --- FILTER BUTTONS LOGIC ---
document.getElementById('showAllBtn').onclick = function() {
    this.classList.add('active');
    this.style.background = '#13171f';
    document.getElementById('showShortlistedBtn').classList.remove('active');
    document.getElementById('showShortlistedBtn').style.background = 'transparent';
    renderTable(currentResumesData);
};

document.getElementById('showShortlistedBtn').onclick = function() {
    this.classList.add('active');
    this.style.background = 'rgba(76, 175, 80, 0.05)';
    document.getElementById('showAllBtn').classList.remove('active');
    document.getElementById('showAllBtn').style.background = 'transparent';
    
    const shortlistedOnly = currentResumesData.filter(r => r.shortlisted);
    renderTable(shortlistedOnly);
};

document.getElementById('newScreeningBtn').onclick = () => location.reload();
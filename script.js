// --- CLOCK ---
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// --- BOOKMARKS (From External File) ---
async function loadBookmarks() {
    const list = document.getElementById('bookmarks-list');
    try {
        const response = await fetch('bookmarks.json');
        if (!response.ok) throw new Error('Could not fetch bookmarks');
        const bookmarksData = await response.json();
        
        list.innerHTML = bookmarksData.map(link => `
            <a href="${link.url}" target="_blank" class="card">${link.name}</a>
        `).join('');
    } catch (err) {
        console.error(err);
        list.innerHTML = `<p style="color: #ff4444; font-size: 0.8rem;">
            ⚠️ Local file access blocked. Upload to GitHub or use a Local Server to see bookmarks.
        </p>`;
    }
}
loadBookmarks();

// --- SEARCH ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

// 1. Listen for the key combination
searchInput.addEventListener('keydown', (e) => {
    // Check for Shift + Enter
    if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault(); // Prevent the default new line
        searchForm.requestSubmit(); // Triggers the 'submit' event listener below
    }
});

// --- SPEED METER ---
const canvas = document.getElementById('speed-gauge');
const ctx = canvas.getContext('2d');
const speedText = document.getElementById('speed-text');
const retestBtn = document.getElementById('retest-btn');

function drawGauge(speed) {
    const cX = 75, cY = 75, radius = 50;
    ctx.clearRect(0, 0, 150, 150);
    ctx.beginPath();
    ctx.arc(cX, cY, radius, 0.8 * Math.PI, 0.2 * Math.PI);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 10; ctx.stroke();
    const val = Math.min(speed / 100, 1);
    const end = 0.8 * Math.PI + (1.4 * Math.PI * val);
    ctx.beginPath();
    ctx.arc(cX, cY, radius, 0.8 * Math.PI, end);
    ctx.strokeStyle = '#00adb5'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
}

async function testSpeed() {
    speedText.textContent = "Testing...";
    retestBtn.disabled = true;
    drawGauge(0);
    
    // Using a 25MB request to allow the connection to reach "peak" speed
    const testFile = "https://speed.cloudflare.com/__down?bytes=25000000"; 
    const startTime = performance.now();
    
    try {
        const response = await fetch(testFile, { cache: "no-store" });
        if (!response.ok) throw new Error();

        const reader = response.body.getReader();
        let received = 0;

        while(true) {
            const {done, value} = await reader.read();
            if (done) break;
            received += value.length;
            
            // Real-time gauge updates during the download
            const currentTime = performance.now();
            const elapsed = (currentTime - startTime) / 1000;
            if (elapsed > 0) {
                const currentMbps = ((received * 8) / (elapsed * 1024 * 1024)).toFixed(1);
                drawGauge(currentMbps);
                speedText.textContent = `${currentMbps} Mbps`;
            }
        }

        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        
        // Final Calculation (Total bits / Total seconds)
        const finalMbps = ((received * 8) / (duration * 1024 * 1024)).toFixed(1);
        
        speedText.textContent = `${finalMbps} Mbps`;
        drawGauge(finalMbps);

    } catch (e) {
        console.error(e);
        speedText.textContent = "Error";
    }
    retestBtn.disabled = false;
}
retestBtn.addEventListener('click', testSpeed);
window.addEventListener('load', () => { drawGauge(0); testSpeed(); });

// --- LOG ---
const logArea = document.getElementById('daily-log');
logArea.value = localStorage.getItem('userLog') || "";
logArea.addEventListener('input', () => {
    localStorage.setItem('userLog', logArea.value);
    document.getElementById('save-status').classList.add('show');
    setTimeout(() => document.getElementById('save-status').classList.remove('show'), 1000);
});
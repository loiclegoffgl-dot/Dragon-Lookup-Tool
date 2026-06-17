const API_BASE_URL = "https://script.google.com/macros/s/AKfycbwMQSuafGd_7h_Di2wAFVU5_XKav4AzKwhjIoHMHGOcfFYXXtOPSCUH6LfhtWgq_Pex/exec";

const dragonNameInput = document.getElementById('dragonName');
const dateFromInput = document.getElementById('dateFrom');
const dateToInput = document.getElementById('dateTo');
const searchDragonBtn = document.getElementById('searchDragonBtn');
const pastDaysInput = document.getElementById('pastDays');
const searchUnusedBtn = document.getElementById('searchUnusedBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');

searchDragonBtn.addEventListener('click', handleSearchDragon);
searchUnusedBtn.addEventListener('click', handleSearchUnused);

async function handleSearchDragon() {
    const dragonValue = dragonNameInput.value.trim();
    if (!dragonValue) {
        showError('Please enter one or more Dragon IDs separated by ;');
        return;
    }
    if (!dateFromInput.value) {
        showError('Please select a From Date');
        return;
    }
    if (!dateToInput.value) {
        showError('Please select a To Date');
        return;
    }
    const dateFrom = dateFromInput.value;
    const dateTo = dateToInput.value;
    if (new Date(dateFrom) > new Date(dateTo)) {
        showError('From Date must be before To Date');
        return;
    }
    const cleanedDragons = dragonValue.split(';').map(d => d.trim()).filter(d => d !== "").join('|'); 
    const url = API_BASE_URL + "?action=search&dragon=" + encodeURIComponent(cleanedDragons) + "&from=" + dateFrom + "&to=" + dateTo;
    await fetchAndDisplayResults(url, 'search');
}

async function handleSearchUnused() {
    if (!pastDaysInput.value) {
        showError('Please enter a number of past days');
        return;
    }
    const days = parseInt(pastDaysInput.value);
    if (isNaN(days) || days < 0) {
        showError('Past days must be a positive number');
        return;
    }
    const url = API_BASE_URL + "?action=unused&days=" + days;
    await fetchAndDisplayResults(url, 'unused');
}

async function fetchAndDisplayResults(url, type) {
    showLoading(true);
    hideError();
    resultsSection.style.display = 'none';
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("API Error: " + response.status);
        }
        const data = await response.json();
        if (data.error) {
            showError(data.error);
            showLoading(false);
            return;
        }
        if (type === 'search') {
            displaySearchResults(data);
        } else if (type === 'unused') {
            displayUnusedResults(data);
        }
        showLoading(false);
        resultsSection.style.display = 'block';
    } catch (error) {
        console.error('Fetch Error:', error);
        showError("Failed to fetch data: " + error.message);
        showLoading(false);
    }
}

function displaySearchResults(data) {
    resultsContainer.innerHTML = '';
    const dragonListText = data.dragons ? data.dragons.join(', ') : (data.dragon || 'Unknown Dragon');
    const headerHTML = '<div class="result-header"><h3>🐉 ' + escapeHtml(dragonListText) + '</h3><p>Found <strong>' + (data.count || 0) + '</strong> use case(s) between ' + (data.filter?.from || '') + ' and ' + (data.filter?.to || '') + '</p></div>';
    resultsContainer.innerHTML += headerHTML;
    if (!data.results || data.results.length === 0) {
        resultsContainer.innerHTML += '<div class="result-item"><p style="text-align: center; color: #999;">No results found for this dragon in the specified date range.</p></div>';
        return;
    }
    data.results.forEach((result, index) => {
        const resultHTML = '<div class="result-item"><h4>' + escapeHtml(result.dragon) + ' — Use Case #' + (index + 1) + '</h4><div class="result-meta"><div class="meta-item"><span class="meta-label">Date Range:</span><span class="meta-value">' + (result.dateRange || 'N/A') + '</span></div><div class="meta-item"><span class="meta-label">Category:</span><span class="meta-value">' + escapeHtml(result.category || 'N/A') + '</span></div><div class="meta-item"><span class="meta-label">Subcategory:</span><span class="meta-value">' + escapeHtml(result.subcategory || 'N/A') + '</span></div><div class="meta-item"><span class="meta-label">Context:</span><span class="meta-value">' + escapeHtml(result.context || 'N/A') + '</span></div></div><div class="content-box">' + escapeHtml(result.fullContent) + '</div></div>';
        resultsContainer.innerHTML += resultHTML;
    });
}

function displayUnusedResults(data) {
    resultsContainer.innerHTML = '';
    const headerHTML = '<div class="result-header"><h3>🐉 Unused Dragons Report</h3><p><strong>' + data.unusedCount + '</strong> unused dragons out of <strong>' + data.masterTotal + '</strong> total dragons</p><p>Cutoff Date: ' + data.cutoff + ' (' + data.days + ' days)</p></div>';
    resultsContainer.innerHTML += headerHTML;
    if (!data.unused || data.unused.length === 0) {
        resultsContainer.innerHTML += '<div class="result-item"><p style="text-align: center; color: #999;">No unused dragons found.</p></div>';
        return;
    }
    const tableRows = data.unused.map(dragon => '<tr><td>' + escapeHtml(dragon.dragonId) + '</td><td>' + (dragon.lastUsed || 'Never') + '</td><td>' + (dragon.daysSince !== null ? dragon.daysSince : '-') + '</td></tr>').join('');
    resultsContainer.innerHTML += '<div class="result-item"><table class="unused-table"><thead><tr><th>Dragon ID</th><th>Last Used</th><th>Days Since</th></tr></thead><tbody>' + tableRows + '</tbody></table></div>';
}

function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    searchDragonBtn.disabled = show;
    searchUnusedBtn.disabled = show;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

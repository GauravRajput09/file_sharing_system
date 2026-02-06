// Storage keys
const STORAGE_KEYS = {
    USERS: 'linkvault_users',
    CURRENT_USER: 'linkvault_current_user',
    CHAT_MESSAGES: 'linkvault_chat_messages'
};

// State management
let currentUser = null;
let users = {};
let chatMessages = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    checkAuth();
    setupEventListeners();
});

// Load data from localStorage
function loadFromStorage() {
    try {
        const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
        users = usersData ? JSON.parse(usersData) : {};
        
        const currentUserData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        currentUser = currentUserData ? JSON.parse(currentUserData) : null;
        
        const chatData = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
        chatMessages = chatData ? JSON.parse(chatData) : [];
    } catch (error) {
        console.error('Error loading from storage:', error);
        users = {};
        currentUser = null;
        chatMessages = [];
    }
}

// Save to localStorage
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(chatMessages));
    } catch (error) {
        console.error('Error saving to storage:', error);
        showToast('Error saving data', 'error');
    }
}

// Check authentication
function checkAuth() {
    if (currentUser) {
        showLibraryScreen();
    } else {
        showLoginScreen();
    }
}

// Show login screen
function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('libraryScreen').classList.add('hidden');
    document.getElementById('chatSidebar').classList.add('hidden');
}

// Show library screen
function showLibraryScreen() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('libraryScreen').classList.remove('hidden');
    document.getElementById('currentUserEmail').textContent = currentUser.email;
    renderURLs();
    updateURLCount();
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Add URL form
    document.getElementById('addUrlForm').addEventListener('submit', handleAddURL);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Download button
    document.getElementById('downloadBtn').addEventListener('click', handleDownload);
    
    // Chat toggle
    document.getElementById('chatToggle').addEventListener('click', toggleChat);
    document.getElementById('closeChatBtn').addEventListener('click', toggleChat);
    
    // Chat form
    document.getElementById('chatForm').addEventListener('submit', handleSendMessage);
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('emailInput').value.trim().toLowerCase();
    
    if (!email) {
        showToast('Please enter an email', 'error');
        return;
    }
    
    // Create or get user
    if (!users[email]) {
        users[email] = {
            email: email,
            urls: [],
            createdAt: new Date().toISOString()
        };
    }
    
    currentUser = users[email];
    saveToStorage();
    showLibraryScreen();
    showToast(`Welcome, ${email}!`, 'success');
    
    // Clear login form
    document.getElementById('emailInput').value = '';
}

// Handle logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    showLoginScreen();
    showToast('Logged out successfully', 'success');
}

// Handle add URL
function handleAddURL(e) {
    e.preventDefault();
    
    const urlInput = document.getElementById('urlInput');
    const titleInput = document.getElementById('titleInput');
    const url = urlInput.value.trim();
    const title = titleInput.value.trim();
    
    if (!url) {
        showToast('Please enter a URL', 'error');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (error) {
        showToast('Please enter a valid URL', 'error');
        return;
    }
    
    // Add URL to user's collection
    const newURL = {
        id: Date.now().toString(),
        url: url,
        title: title || extractTitleFromURL(url),
        createdAt: new Date().toISOString()
    };
    
    currentUser.urls.unshift(newURL);
    users[currentUser.email] = currentUser;
    saveToStorage();
    
    // Clear form
    urlInput.value = '';
    titleInput.value = '';
    
    renderURLs();
    updateURLCount();
    showToast('Link added successfully!', 'success');
}

// Extract title from URL
function extractTitleFromURL(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');
        return hostname.charAt(0).toUpperCase() + hostname.slice(1);
    } catch (error) {
        return 'Untitled Link';
    }
}

// Handle delete URL
function handleDeleteURL(urlId) {
    if (!confirm('Are you sure you want to delete this link?')) {
        return;
    }
    
    currentUser.urls = currentUser.urls.filter(url => url.id !== urlId);
    users[currentUser.email] = currentUser;
    saveToStorage();
    
    renderURLs();
    updateURLCount();
    showToast('Link deleted', 'success');
}

// Render URLs
function renderURLs() {
    const urlList = document.getElementById('urlList');
    const emptyState = document.getElementById('emptyState');
    
    if (!currentUser.urls || currentUser.urls.length === 0) {
        urlList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    urlList.innerHTML = currentUser.urls.map(url => `
        <div class="url-item">
            <div class="url-item-header">
                <div class="url-item-title">
                    <h3>${escapeHTML(url.title)}</h3>
                    <a href="${escapeHTML(url.url)}" target="_blank" rel="noopener noreferrer" class="url-item-link">
                        ${escapeHTML(url.url)}
                    </a>
                </div>
                <div class="url-item-actions">
                    <button class="btn-delete" onclick="handleDeleteURL('${url.id}')" title="Delete">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15C5 15.5304 5.21071 16.0391 5.58579 16.4142C5.96086 16.7893 6.46957 17 7 17H11C11.5304 17 12.0391 16.7893 12.4142 16.4142C12.7893 16.0391 13 15.5304 13 15L14 5M6 5V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2H11C11.2652 2 11.5196 2.10536 11.7071 2.29289C11.8946 2.48043 12 2.73478 12 3V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="url-item-meta">
                Added ${formatDate(url.createdAt)}
            </div>
        </div>
    `).join('');
}

// Update URL count
function updateURLCount() {
    const count = currentUser?.urls?.length || 0;
    const countText = count === 1 ? '1 link' : `${count} links`;
    document.getElementById('urlCount').textContent = countText;
}

// Handle download
function handleDownload() {
    if (!currentUser || !currentUser.urls || currentUser.urls.length === 0) {
        showToast('No links to download', 'error');
        return;
    }
    
    const dataStr = JSON.stringify({
        email: currentUser.email,
        exportDate: new Date().toISOString(),
        urls: currentUser.urls
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linkvault-${currentUser.email.replace('@', '-')}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Library downloaded!', 'success');
}

// Toggle chat
function toggleChat() {
    const chatSidebar = document.getElementById('chatSidebar');
    const isHidden = chatSidebar.classList.contains('hidden');
    
    if (!currentUser) {
        showToast('Please login first', 'error');
        return;
    }
    
    if (isHidden) {
        chatSidebar.classList.remove('hidden');
        renderChatMessages();
        scrollChatToBottom();
    } else {
        chatSidebar.classList.add('hidden');
    }
}

// Handle send message
function handleSendMessage(e) {
    e.preventDefault();
    
    const chatInput = document.getElementById('chatInput');
    const messageText = chatInput.value.trim();
    
    if (!messageText) {
        return;
    }
    
    const message = {
        id: Date.now().toString(),
        email: currentUser.email,
        text: messageText,
        timestamp: new Date().toISOString()
    };
    
    chatMessages.push(message);
    saveToStorage();
    
    chatInput.value = '';
    renderChatMessages();
    scrollChatToBottom();
}

// Render chat messages
function renderChatMessages() {
    const chatMessagesContainer = document.getElementById('chatMessages');
    
    // Filter messages for current user's email
    const userMessages = chatMessages.filter(msg => msg.email === currentUser.email);
    
    if (userMessages.length === 0) {
        chatMessagesContainer.innerHTML = `
            <div class="chat-welcome">
                <p>Welcome to the chat room! Only users with the same email (${currentUser.email}) can see these messages.</p>
            </div>
        `;
        return;
    }
    
    chatMessagesContainer.innerHTML = userMessages.map(msg => `
        <div class="chat-message ${msg.email === currentUser.email ? 'own' : ''}">
            <div class="chat-message-header">
                <span class="chat-message-email">${escapeHTML(msg.email)}</span>
                <span class="chat-message-time">${formatTime(msg.timestamp)}</span>
            </div>
            <div class="chat-message-text">${escapeHTML(msg.text)}</div>
        </div>
    `).join('');
}

// Scroll chat to bottom
function scrollChatToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);
    
    if (diffInMinutes < 1) {
        return 'Just now';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
}

// Format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Escape HTML to prevent XSS
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export data for download (useful for users)
function exportAllData() {
    const allData = {
        users: users,
        chatMessages: chatMessages,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linkvault-full-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Make functions globally available
window.handleDeleteURL = handleDeleteURL;
window.exportAllData = exportAllData;
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener('DOMContentLoaded', () => {
    const checkLoginStatus = () => {
        return document.cookie.includes('token=admin_token');
    };
    const isLoggedIn = checkLoginStatus();
    // 1. UI Updates based on Login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        if (isLoggedIn) {
            loginBtn.innerHTML = '<i data-lucide="log-out"></i> Wyloguj';
            loginBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
                yield fetch('/api/logout', { method: 'POST' });
                window.location.reload();
            }));
        }
        else {
            loginBtn.addEventListener('click', () => {
                var _a;
                (_a = document.getElementById('login-modal')) === null || _a === void 0 ? void 0 : _a.classList.add('open');
            });
        }
    }
    // Admin Panel Logic
    if (window.location.pathname === '/admin') {
        if (isLoggedIn) {
            document.getElementById('admin-panel').style.display = 'grid';
            document.getElementById('admin-login-notice').style.display = 'none';
        }
        const newsForm = document.getElementById('news-form');
        if (newsForm) {
            newsForm.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
                e.preventDefault();
                const title = document.getElementById('news-title').value;
                const excerpt = document.getElementById('news-excerpt').value;
                const res = yield fetch('/api/news', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        excerpt,
                        date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
                    })
                });
                if (res.ok) {
                    alert('News dodany!');
                    newsForm.reset();
                }
                else {
                    alert('Błąd autoryzacji');
                }
            }));
        }
    }
    // FTP Logic
    if (window.location.pathname === '/ftp') {
        const uploadBtn = document.getElementById('upload-btn');
        const fileInput = document.getElementById('file-upload');
        if (isLoggedIn && uploadBtn) {
            uploadBtn.style.display = 'inline-flex';
            uploadBtn.addEventListener('click', () => {
                fileInput === null || fileInput === void 0 ? void 0 : fileInput.click();
            });
            fileInput === null || fileInput === void 0 ? void 0 : fileInput.addEventListener('change', (e) => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
                if (!file)
                    return;
                const formData = new FormData();
                formData.append('file', file);
                const res = yield fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) {
                    alert('Plik wrzucony pomyślnie!');
                    loadFiles();
                }
                else {
                    alert('Błąd podczas wgrywania');
                }
            }));
        }
        const loadFiles = () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield fetch('/api/files');
            const files = yield res.json();
            const tbody = document.getElementById('ftp-tbody');
            if (tbody) {
                let html = `
                    <tr>
                        <td colspan="3" class="file-name" style="color: var(--primary) !important;">
                            <i data-lucide="corner-left-up"></i> Parent Directory
                        </td>
                    </tr>
                `;
                files.forEach((file) => {
                    const icon = file.type === 'folder'
                        ? '<i data-lucide="folder"></i>'
                        : '<i data-lucide="file" class="icon-file"></i>';
                    html += `
                        <tr>
                            <td class="file-name">${icon} ${file.name}</td>
                            <td>${file.date}</td>
                            <td>${file.size}</td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
                // @ts-ignore
                if (window.lucide)
                    window.lucide.createIcons();
            }
        });
        loadFiles();
    }
    // News Logic
    if (window.location.pathname === '/' || window.location.pathname === '') {
        const loadNews = () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield fetch('/api/news');
            const newsList = yield res.json();
            const grid = document.getElementById('news-grid');
            if (grid) {
                let html = '';
                newsList.forEach((news) => {
                    html += `
                        <article class="news-card glassmorphism">
                            <span class="date">${news.date}</span>
                            <h3>${news.title}</h3>
                            <p>${news.excerpt}</p>
                        </article>
                    `;
                });
                grid.innerHTML = html;
            }
        });
        loadNews();
    }
    // Login Modal Logic
    const closeLogin = document.getElementById('close-login');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    if (loginModal && closeLogin) {
        closeLogin.addEventListener('click', () => {
            loginModal.classList.remove('open');
        });
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.remove('open');
            }
        });
    }
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
            e.preventDefault();
            const login = document.getElementById('login-input').value;
            const password = document.getElementById('password-input').value;
            const res = yield fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });
            if (res.ok) {
                window.location.reload();
            }
            else {
                alert('Nieprawidłowy login lub hasło! (Podpowiedź: admin / admin)');
            }
        }));
    }
});

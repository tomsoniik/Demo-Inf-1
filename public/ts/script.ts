document.addEventListener('DOMContentLoaded', () => {
    
    const checkLoginStatus = () => {
        return document.cookie.includes('token=admin_token');
    };

    const isLoggedIn = checkLoginStatus();

    // 1. UI Updates
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.reload();
        });
    }

    const loginModalBtn = document.getElementById('login-modal-btn');
    if (loginModalBtn) {
        loginModalBtn.addEventListener('click', () => {
            document.getElementById('login-modal')?.classList.add('open');
        });
    }

    // Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    // Check local storage for collapsed state
    if (localStorage.getItem('sidebar-collapsed') === 'true' && sidebar) {
        sidebar.classList.add('collapsed');
    }

    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed').toString());
        });
    }

    // Admin Panel Logic
    if (window.location.pathname === '/admin') {
        if (isLoggedIn) {
            document.getElementById('admin-panel')!.style.display = 'grid';
            document.getElementById('admin-login-notice')!.style.display = 'none';
        }

        const loadNewsHistory = async () => {
            const res = await fetch('/api/news');
            const newsList = await res.json();
            const listContainer = document.getElementById('news-history-list');
            if (listContainer) {
                if (newsList.length === 0) {
                    listContainer.innerHTML = '<p style="color: var(--text-muted);">Brak wpisów.</p>';
                    return;
                }
                
                let html = '';
                newsList.forEach((news: any) => {
                    html += `
                        <div class="news-history-item" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0; color: var(--text-main);">${news.title}</h4>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">${news.date}</span>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn-secondary" onclick="deleteNews(${news.id})" style="padding: 0.4rem 0.8rem; border-color: rgba(239, 68, 68, 0.3); color: #ef4444;"><i class="gg-trash"></i> Usuń</button>
                            </div>
                        </div>
                    `;
                });
                listContainer.innerHTML = html;
            }
        };

        (window as any).deleteNews = async (id: number) => {
            if (confirm('Na pewno usunąć ten news?')) {
                const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    loadNewsHistory();
                } else {
                    alert('Błąd usuwania');
                }
            }
        };

        const newsForm = document.getElementById('news-form');
        if (newsForm) {
            newsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = (document.getElementById('news-title') as HTMLInputElement).value;
                const excerpt = (document.getElementById('news-excerpt') as HTMLTextAreaElement).value;
                
                const res = await fetch('/api/news', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        title, 
                        excerpt 
                    })
                });

                if (res.ok) {
                    alert('News dodany!');
                    (newsForm as HTMLFormElement).reset();
                    loadNewsHistory();
                } else {
                    alert('Błąd autoryzacji');
                }
            });
        }
        
        if (isLoggedIn) {
            loadNewsHistory();
        }
    }

    // FTP Logic
    if (window.location.pathname === '/ftp') {
        const uploadBtn = document.getElementById('upload-btn');
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;

        if (isLoggedIn && uploadBtn) {
            uploadBtn.style.display = 'inline-flex';
            uploadBtn.addEventListener('click', () => {
                fileInput?.click();
            });

            fileInput?.addEventListener('change', async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    alert('Plik wrzucony pomyślnie!');
                    loadFiles();
                } else {
                    alert('Błąd podczas wgrywania');
                }
            });
        }

        const loadFiles = async () => {
            const res = await fetch('/api/files');
            const files = await res.json();
            const tbody = document.getElementById('ftp-tbody');
            
            if (tbody) {
                let html = `
                    <tr>
                        <td colspan="3" class="file-name" style="color: var(--primary) !important;">
                            <i class="gg-arrow-left-up"></i> Parent Directory
                        </td>
                    </tr>
                `;

                files.forEach((file: any) => {
                    const icon = file.type === 'folder' 
                        ? '<i class="gg-folder"></i>' 
                        : '<i class="gg-file" class="icon-file"></i>';
                    
                    html += `
                        <tr>
                            <td class="file-name">${icon} ${file.name}</td>
                            <td>${file.date}</td>
                            <td>${file.size}</td>
                        </tr>
                    `;
                });
                
                tbody.innerHTML = html;
                
            }
        };

        loadFiles();
    }

    // News Logic
    if (window.location.pathname === '/' || window.location.pathname === '') {
        const loadNews = async () => {
            const res = await fetch('/api/news');
            const newsList = await res.json();
            const grid = document.getElementById('news-grid');
            
            if (grid) {
                if (newsList.length === 0) {
                    grid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                            <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
                                <i class="gg-inbox" style="color: var(--text-muted); --ggs: 2;"></i>
                            </div>
                            <h3 style="color: var(--text-main); margin-bottom: 0.5rem;">Brak aktualności</h3>
                            <p style="color: var(--text-muted);">Zaloguj się jako administrator, aby dodać pierwsze wpisy.</p>
                        </div>
                    `;
                } else {
                    let html = '';
                    newsList.forEach((news: any) => {
                        html += `
                            <article class="news-card glassmorphism">
                                <span class="date" style="display: flex; align-items: center; gap: 0.25rem;"><i class="gg-calendar-dates" style="transform: scale(0.8);"></i> ${news.date}</span>
                                <h3 style="margin-top: 0.5rem;">${news.title}</h3>
                                <p>${news.excerpt}</p>
                            </article>
                        `;
                    });
                    grid.innerHTML = html;
                }
                
            }
        };

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
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const login = (document.getElementById('login-input') as HTMLInputElement).value;
            const password = (document.getElementById('password-input') as HTMLInputElement).value;

            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });

            if (res.ok) {
                window.location.reload();
            } else {
                alert('Nieprawidłowy login lub hasło! (Podpowiedź: admin / admin)');
            }
        });
    }
});

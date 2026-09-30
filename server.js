"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Middleware to check if logged in
const isAdmin = (req) => {
    return req.cookies.token === 'admin_token';
};
const authMiddleware = (req, res, next) => {
    if (isAdmin(req)) {
        next();
    }
    else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};
// Multer setup
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, 'uploads');
        if (!fs_1.default.existsSync(uploadPath))
            fs_1.default.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage });
const dataPath = path_1.default.join(__dirname, 'data', 'news.json');
if (!fs_1.default.existsSync(dataPath)) {
    if (!fs_1.default.existsSync(path_1.default.join(__dirname, 'data')))
        fs_1.default.mkdirSync(path_1.default.join(__dirname, 'data'));
    fs_1.default.writeFileSync(dataPath, JSON.stringify([]));
}
// Pages routes
app.get('/', (req, res) => {
    res.render('index', { isAdmin: isAdmin(req) });
});
app.get('/ftp', (req, res) => {
    res.render('ftp', { isAdmin: isAdmin(req) });
});
app.get('/admin', (req, res) => {
    res.render('admin', { isAdmin: isAdmin(req) });
});
// API Routes
app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    if (login === 'admin' && password === 'admin') {
        res.cookie('token', 'admin_token');
        res.json({ success: true });
    }
    else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});
app.get('/api/news', (req, res) => {
    const news = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
    res.json(news);
});
app.post('/api/news', authMiddleware, (req, res) => {
    const { title, date, excerpt } = req.body;
    const news = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
    news.unshift({ id: Date.now(), title, date, excerpt });
    fs_1.default.writeFileSync(dataPath, JSON.stringify(news, null, 2));
    res.json({ success: true });
});
app.get('/api/files', (req, res) => {
    const uploadPath = path_1.default.join(__dirname, 'uploads');
    if (!fs_1.default.existsSync(uploadPath))
        fs_1.default.mkdirSync(uploadPath);
    const files = fs_1.default.readdirSync(uploadPath).map(filename => {
        const stats = fs_1.default.statSync(path_1.default.join(uploadPath, filename));
        return {
            name: filename,
            date: stats.mtime.toISOString().split('T')[0],
            size: (stats.size / 1024).toFixed(2) + ' KB',
            type: stats.isDirectory() ? 'folder' : 'file'
        };
    });
    res.json(files);
});
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
    res.json({ success: true, file: req.file });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

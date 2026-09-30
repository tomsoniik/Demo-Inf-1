import express from 'express';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check if logged in
const isAdmin = (req: express.Request) => {
    return req.cookies.token === 'admin_token';
};

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (isAdmin(req)) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Vercel Support
const isVercel = !!process.env.VERCEL;
const uploadPath = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const dataPath = path.join(__dirname, 'data', 'news.json');
let memoryNews: any[] = [];
try {
    if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify([]));
    memoryNews = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (e) {
    console.error('Error loading news:', e);
}

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

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
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

app.get('/api/news', (req, res) => {
    res.json(memoryNews);
});

app.post('/api/news', authMiddleware, (req, res) => {
    const { title, excerpt } = req.body;
    const date = new Date().toISOString().split('T')[0];
    memoryNews.unshift({ id: Date.now(), title, date, excerpt });
    
    if (!isVercel) {
        fs.writeFileSync(dataPath, JSON.stringify(memoryNews, null, 2));
    }
    res.json({ success: true });
});

app.get('/api/files', (req, res) => {
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    
    const files = fs.readdirSync(uploadPath).map(filename => {
        const stats = fs.statSync(path.join(uploadPath, filename));
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

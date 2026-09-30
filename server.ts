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

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

const dataPath = path.join(__dirname, 'data', 'news.json');
if (!fs.existsSync(dataPath)) {
    if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
    fs.writeFileSync(dataPath, JSON.stringify([]));
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
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

app.get('/api/news', (req, res) => {
    const news = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(news);
});

app.post('/api/news', authMiddleware, (req, res) => {
    const { title, date, excerpt } = req.body;
    const news = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    news.unshift({ id: Date.now(), title, date, excerpt });
    fs.writeFileSync(dataPath, JSON.stringify(news, null, 2));
    res.json({ success: true });
});

app.get('/api/files', (req, res) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    
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

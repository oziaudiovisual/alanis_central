require('dotenv').config();

const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const pool = require('./config/database');
const Admin = require('./models/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for Chart.js
}));
app.use(morgan('short', {
    skip: (req) => req.url.startsWith('/css/') || req.url.startsWith('/js/') || req.url === '/logo.webp' || req.url === '/favicon.ico',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Favicon → use logo
app.get('/favicon.ico', (req, res) => {
    res.redirect(301, '/logo.webp');
});

// ---------- View Engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------- Trust Proxy (EasyPanel / Traefik) ----------
app.set('trust proxy', 1);

// ---------- Session ----------
app.use(session({
    store: new PgSession({
        pool,
        tableName: 'session',
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    },
}));

// ---------- Routes ----------
app.use('/webhook', require('./routes/webhook'));
app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/buyers', require('./routes/buyers'));
app.use('/transactions', require('./routes/transactions'));
app.use('/settings', require('./routes/settings'));

// ---------- Error handler ----------
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).render('error', { message: 'Erro interno do servidor' });
});

// ---------- Bootstrap ----------
async function bootstrap() {
    // Run migrations
    try {
        const migrationPath = path.join(__dirname, '../migrations/001_initial.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(sql);
        console.log('✓ Database migrations applied');
    } catch (err) {
        console.error('Migration error:', err.message);
    }

    // Seed admin if none exists
    try {
        const count = await Admin.count();
        if (count === 0) {
            const email = process.env.ADMIN_EMAIL || 'admin@alanis.com';
            const password = process.env.ADMIN_PASSWORD || 'admin123';
            await Admin.create(email, password);
            console.log(`✓ Admin created: ${email}`);
        } else {
            console.log('✓ Admin already exists');
        }
    } catch (err) {
        console.error('Admin seed error:', err.message);
    }

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 Alanis Central de Vendas running on port ${PORT}`);
        console.log(`   Dashboard: http://localhost:${PORT}`);
        console.log(`   Webhook:   POST http://localhost:${PORT}/webhook/cakto\n`);
    });
}

bootstrap();

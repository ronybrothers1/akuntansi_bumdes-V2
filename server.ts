import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-bumdes-key-2026';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'bumdes.sqlite'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      otp TEXT
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS user_data (
      user_id INTEGER PRIMARY KEY,
      data TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

// Email setup
let transporter: nodemailer.Transporter;

async function setupEmail() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to Ethereal for testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Ethereal Email account created for testing:', testAccount.user);
  }
}
setupEmail();

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    db.run('INSERT INTO users (email, password, otp) VALUES (?, ?, ?)', [email, hashedPassword, otp], async function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      // Send OTP email
      try {
        const info = await transporter.sendMail({
          from: '"Sistem Akuntansi BUMDes" <noreply@bumdes.id>',
          to: email,
          subject: 'Kode Verifikasi Registrasi BUMDes',
          text: `Kode OTP Anda adalah: ${otp}`,
          html: `<b>Kode OTP Anda adalah: ${otp}</b>`,
        });
        
        console.log('Message sent: %s', info.messageId);
        if (info.messageId && nodemailer.getTestMessageUrl(info)) {
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        
        res.json({ message: 'Registration successful, please verify OTP' });
      } catch (emailErr) {
        console.error('Error sending email:', emailErr);
        // Even if email fails, we allow them to verify if they somehow know it (or we can just return the OTP for dev purposes)
        // In a real app, we might want to return an error, but for this preview, we'll return the OTP in development
        res.json({ message: 'Registration successful, please verify OTP', devOtp: otp });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  const { email, otp } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user: any) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.is_verified) return res.status(400).json({ error: 'User already verified' });
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    db.run('UPDATE users SET is_verified = 1, otp = NULL WHERE id = ?', [user.id], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: 'Database error' });
      
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, email: user.email } });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user: any) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
    
    if (!user.is_verified) return res.status(403).json({ error: 'Please verify your email first', needsVerification: true });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

app.get('/api/storage', authenticateToken, (req: any, res) => {
  db.get('SELECT data FROM user_data WHERE user_id = ?', [req.user.id], (err, row: any) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (row && row.data) {
      res.json({ data: JSON.parse(row.data) });
    } else {
      res.json({ data: null });
    }
  });
});

app.post('/api/storage', authenticateToken, (req: any, res) => {
  const { data } = req.body;
  const dataStr = JSON.stringify(data);
  
  db.run(
    'INSERT INTO user_data (user_id, data) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data',
    [req.user.id, dataStr],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true });
    }
  );
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

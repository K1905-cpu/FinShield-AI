import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db.js';
import { authenticate, AuthRequest, generateToken } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router();

// Demo accounts metadata for display on login page
export const DEMO_CREDENTIALS = [
  {
    role: 'Admin',
    email: 'admin@finshield.ai',
    password: 'Admin@123',
    description: 'Full administrative access: user management, fraud rules, audit logs, all transactions',
  },
  {
    role: 'Analyst',
    email: 'analyst@finshield.ai',
    password: 'Analyst@123',
    description: 'Fraud investigation access: risk analytics, alert handling, transaction reviews, reports',
  },
  {
    role: 'User',
    email: 'user@finshield.ai',
    password: 'User@123',
    description: 'Retail customer access: personal finance dashboard, CSV upload, personal risk alerts',
  }
];

router.get('/demo-accounts', (_req, res) => {
  res.json({ accounts: DEMO_CREDENTIALS });
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'This account has been suspended by an administrator.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);

    // Audit log
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    recordAuditLog(req, 'User Login', `User ${user.email} (${user.role}) authenticated successfully.`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `usr_${uuidv4().slice(0, 8)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'user' as const, // Normal users can only register as regular 'user'
      status: 'active' as const,
      createdAt: new Date().toISOString()
    };

    db.addUser(newUser);

    // Initialize baseline behavior profile for the new user
    db.setUserBehavior(newUser.id, {
      userId: newUser.id,
      avgAmount: 2500,
      maxAmount: 10000,
      frequentLocations: ['Mumbai'],
      knownDevices: ['DEV-WEB-CLIENT'],
      commonCategories: ['Shopping', 'Food', 'Bills'],
      totalTransactions: 0,
      lastTransactionTimestamp: new Date().toISOString()
    });

    const token = generateToken(newUser);

    req.user = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
    recordAuditLog(req, 'User Registration', `New user registered: ${newUser.email}`);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = db.getUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    }
  });
});

export default router;

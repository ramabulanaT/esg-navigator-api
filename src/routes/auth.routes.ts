import express from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, organization } = req.body;

    if (!email || !password || !name || !organization) {
      return res.status(400).json({ 
        error: 'Email, password, name, and organization required' 
      });
    }

    const result = await authService.register({
      email,
      password,
      name,
      organization
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Logout (client-side token removal, but endpoint for consistency)
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;

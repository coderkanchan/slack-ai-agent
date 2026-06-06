import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import { slackRawBodyParser } from './middlewares/slackBodyParser.js';
import { slackRouter } from './routes/slack.js';
import { TaskModel } from './models/Task.js';

const app = express();

// Global Cross-Origin Middlewares Setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- ISOLATED MIDDLEWARE INTERCEPTION ROUTING GRID ---
// Is route par express.json() generic state execute nahi honi chahiye
app.use('/slack/events', slackRawBodyParser, slackRouter);

// REST Downstream API Request Body Parsers
app.use(express.json());

// Main Infrastructure Diagnostics / UI Endpoints
app.get('/api/dashboard/analytics', async (req: express.Request, res: express.Response) => {
  try {
    const allTasks = await TaskModel.find({}).sort({ createdAt: -1 });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const pendingTasks = allTasks.filter((t: any) => t.status === 'PENDING').length;

    const activeVibeScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return res.status(200).json({
      success: true,
      metrics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        activeVibeScore
      },
      tasks: allTasks
    });
  } catch (error) {
    console.error('[Dashboard Endpoint Critical failure]:', error);
    return res.status(500).json({ success: false, error: 'Database stats extraction failed.' });
  }
});

const startServer = async () => {
  await connectDatabase();
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🚀 [Server Boot] VibeCheck Corporate Hub Core is live on professionally decoupled port ${port}`);
  });
};

startServer().catch((err) => {
  console.error('[Critical App Core Crash]:', err);
});
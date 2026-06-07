import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import { slackRawBodyParser } from './middlewares/slackBodyParser.js';
import { slackApp } from './config/slack.js'; 
import './routes/slack.js'; 
import { TaskModel } from './models/Task.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// GLOBAL DIRECT MOUNTING: No intermediate router trap!
app.post('/slack/events', slackRawBodyParser, async (req: any, res: any) => {
  const receiver = (slackApp as any).receiver;
  if (receiver && typeof receiver.handle === 'function') {
    try {
      await receiver.handle(req, res);
      return;
    } catch (err) {
      console.error("[Index Direct Slack Core Failure]:", err);
      return res.status(500).send();
    }
  }
  return res.status(404).send('Slack receiver not initialized');
});

// Generic JSON body parsers for dashboard APIs safely placed below
app.use(express.json());

app.get('/api/dashboard/analytics', async (req: express.Request, res: express.Response) => {
  try {
    const allTasks = await TaskModel.find({}).sort({ createdAt: -1 });
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const pendingTasks = allTasks.filter((t: any) => t.status === 'PENDING').length;
    const activeVibeScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return res.status(200).json({
      success: true,
      metrics: { totalTasks, completedTasks, pendingTasks, activeVibeScore },
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
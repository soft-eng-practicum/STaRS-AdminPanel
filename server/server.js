import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import emailRoute from './routes/email.route.js';

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Routes
app.use('/api', emailRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` --Email service running on port ${PORT}`));

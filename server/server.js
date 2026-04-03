import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import emailRoute from './routes/email.route.js';
import cors from 'cors';


dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());
// Routes
app.use('/api', emailRoute);

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.status(200).send('Email service is running');
});
app.listen(PORT, () => console.log(` --Email service running on port ${PORT}`));

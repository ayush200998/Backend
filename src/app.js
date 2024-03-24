/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Routes
import UserRoute from './routes/user.routes.js';
import VideoRoute from './routes/video.routes.js';
import PlayListRoute from './routes/playlist.routes.js';

// Constants
import { API_V1 } from './constants.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:8000',
  optionsSuccessStatus: '200',
}));

app.use(express.json({
  limit: '16kb',
}));

app.use(express.urlencoded({
  extended: true,
  limit: '16kb',
}));

app.use(express.static('public'));
app.use(cookieParser());

// Custom routes
app.use(`${API_V1}/users`, UserRoute);
app.use(`${API_V1}/videos`, VideoRoute);
app.use(`${API_V1}/playlists`, PlayListRoute);

export default app;

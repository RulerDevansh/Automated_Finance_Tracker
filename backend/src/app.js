import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

const corsOptions = {
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		const allowed = env.corsOrigins;
		return allowed.includes(origin)
			? callback(null, true)
			: callback(new Error('Not allowed by CORS'));
	},
	credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;

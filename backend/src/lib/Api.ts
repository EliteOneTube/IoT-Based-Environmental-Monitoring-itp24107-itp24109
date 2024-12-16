import express, { Request, Response, NextFunction } from 'express';
import Database from './Database';
import swaggerUi from 'swagger-ui-express';
import Server from './Server';

export default class Api {
    public express: express.Application;

    private database: Database;

    private swaggerDocument = require('../../swagger.json');

    private server: Server;

    constructor(database: Database) {
        this.express = express();
        this.mountRoutes();

        const port = Number(process.env.API_PORT) || 3000;

        this.database = database;

        this.server = new Server(this.express, port);
    }

    private async authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token == null) {
            res.sendStatus(401);
            return;
        }

        if (await this.database.verifyToken(token)) {
            next();
        } else {
            res.sendStatus(403); // Forbidden
        }
    }

    private mountRoutes(): void {
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: true }));

        const router = express.Router();

        router.use('/swagger', swaggerUi.serve, swaggerUi.setup(this.swaggerDocument));

        router.route('/weather')
        .all(this.authenticateToken.bind(this))
        .post(this.addWeatherData.bind(this))
        .get(this.getWeatherData.bind(this));

        this.express.use('/', router);
    }

    private async addWeatherData(req: Request, res: Response): Promise<void> {
        const { temperature, humidity, timestamp } = req.body;

        await this.database.addWeatherData(temperature, humidity, timestamp);

        this.server.broadcast('weather', { temperature, humidity, timestamp });

        res.json({
            message: 'Weather data saved'
        });
    }

    private async getWeatherData(req: Request, res: Response): Promise<void> {
        const weatherData = await this.database.getWeatherData();

        res.json(weatherData);
    }
}
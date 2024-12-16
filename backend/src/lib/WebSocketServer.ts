import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Express } from 'express';

class WebSocketServer {
    private io;

    constructor(app: Express, port: number) {
        const server = createServer(app).listen(port, () =>
            console.log(`App listening on PORT ${port}`)
        );

        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
            path: '/socket',
        });

        this.initializeSocketEvents();
    }

    private initializeSocketEvents(): void {
        this.io.on('connection', (socket: Socket) => {
            console.log('A client connected:', socket.id);

            socket.on('disconnect', () => {
                console.log('A client disconnected:', socket.id);
            });
        });
    }

    public broadcast(event: string, message: any): void {
        this.io.emit(event, message);
    }
}

export default WebSocketServer;
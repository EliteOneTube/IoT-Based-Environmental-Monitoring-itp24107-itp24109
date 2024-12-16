import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

class Server {
    private io: SocketIOServer;

    constructor(app: Express.Application, port: number) {
        const server = createServer(app).listen(port, () =>
            console.log(`App listening on PORT ${port}`)
        );

        this.io = new SocketIOServer(server, {
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

export default Server;
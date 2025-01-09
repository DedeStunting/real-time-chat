import { connection, server as WebSocketServer } from 'websocket';
import http from 'http';
import { IncomingMessage, SupportedMessage } from './messages/incomingMessages';
import { InMemoryStore } from './store/InMemoryStore';
import { UserManager } from './UserManager';
import { OutgoingMessage, SupportedMessage as OutgoingSupportedMessages } from './messages/outgoingMessages';
import { Chat } from './store/Store';

const server = http.createServer(function (request: any, response: any) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

const userManager = new UserManager();
const store = new InMemoryStore();

server.listen(8080, function () {
    console.log((new Date()) + ' Server is listening on port 8080');
});

const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin: string) {
    return true; // Always accept connections
}

wsServer.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    const connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            try {
                messageHandler(connection, JSON.parse(message.utf8Data));
            } catch (error) {
                console.error("Error handling message:", error);
            }
        }
    });
    connection.on('close', function (reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

function messageHandler(ws: connection, message: IncomingMessage) {
    if (message.type === SupportedMessage.JoinRoom) {
        const payload = message.payload;
        userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
    }

    if (message.type === SupportedMessage.SendMessage) {
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId, payload.userId);
        if (!user) {
            console.error("User not found in the db");
            return;
        }

        const chat = store.addChat(payload.userId, user.name, payload.roomId, payload.message);
        if (!chat) {
            console.error("Failed to add chat");
            return;
        }

        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessages.AddChat,
            payload: {
                chatId: (chat as Chat).id, // Assert chat as Chat
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upvotes: 0
            }
        };

        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }

    if (message.type === SupportedMessage.UpvoteMessage) {
        const payload = message.payload;
        const chat = store.upvote(payload.userId, payload.roomId, payload.chatId);
        if (!chat) {
            console.error("Failed to upvote chat");
            return;
        }

        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessages.UpdateChat,
            payload: {
                chatId: payload.chatId,
                roomId: payload.roomId,
                upvotes: (chat as Chat).upvotes.length // Assert chat as Chat
            }
        };

        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
}

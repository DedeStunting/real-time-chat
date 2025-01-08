import { connection } from "websocket";
import { OutgoingMessage } from "./messages/outgoingMessages";

interface User {
    name: string;
    id: string;
    conn: connection;
}

interface Room {
    users: User[];
}

export class UserManager {
    private rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map<string, Room>();
    }

    addUser(name: string, userId: string, roomId: string, socket: connection) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, { users: [] });
        }

        const room = this.rooms.get(roomId);
        if (room) {
            room.users.push({ id: userId, name, conn: socket });
        }
    }

    removeUser(roomId: string, userId: string) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.users = room.users.filter(({ id }) => id !== userId);
        }
    }

    getUser(roomId: string, userId: string): User | null {
        const room = this.rooms.get(roomId);
        if (!room) {
            return null;
        }
        const user = room.users.find(({ id }) => id === userId);
        return user ?? null;
    }

    broadcast(roomId: string, userId: string, message: OutgoingMessage) {
        const user = this.getUser(roomId, userId);
        if (!user) {
            console.error("User not found");
            return;
        }

        const room = this.rooms.get(roomId);
        if (!room) {
            console.error("Room not found");
            return;
        }

        // Broadcast to all users in the room
        room.users.forEach(({ conn }) => {
            try {
                conn.sendUTF(JSON.stringify(message));
            } catch (error) {
                console.error("Error broadcasting message:", error);
            }
        });
    }
}

import { Chat, Store, UserId } from "./Store";
let globalChatId = 0;
export interface Room {
    roomId: string;
    chats: Chat[]
}

export class InMemoryStore implements Store {
    private store: Map<string, Room>;
    constructor() {
        this.store = new Map<string, Room>()
    }
    initRoom(roomId: string) {
        this.store.set(roomId, {
            roomId,
            chats: []
        });
    }

    getChats(roomId: string, limit: number, offset: number) {
        const room = this.store.get(roomId);
        if (!room) {
            return [];
        }
        return room.chats.reverse().slice(0, offset).slice(-1 * limit);

    }
    getRoom(room: string, limit: number, offset: number) {

    }

    addChat(userId: UserId, name: string, roomId: string, message: string): Chat | null {
        const room = this.store.get(roomId);
        if (!room) {
            return null; // Explicitly return null if room doesn't exist
        }
    
        const chat: Chat = {
            id: (globalChatId++).toString(),
            userId,
            name,
            message,
            upvotes: [] // Initialize an empty array for upvotes
        };
        room.chats.push(chat);
        return chat; // Return the created chat
    }
    

    upvote(userId: UserId, roomId: string, chatId: string): Chat | null {
        const room = this.store.get(roomId);
        if (!room) {
            return null; // Explicitly return null if room doesn't exist
        }
    
        const chat = room.chats.find(({ id }) => id === chatId);
        if (!chat) {
            return null; // Explicitly return null if chat is not found
        }
    
        chat.upvotes.push(userId); // Add the userId to upvotes
        return chat; // Return the updated chat
    }
}    


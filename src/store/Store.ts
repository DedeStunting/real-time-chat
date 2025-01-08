
export type UserId = string;

export interface Chat {
    id: string;
    userId: UserId;
    name: string;
    message: string;
    upvotes: UserId[]; //who has upvoted what
}
export  abstract class Store {
    constructor() {

    }
    initRoom(roomId: string) {

    }

    getChats(oom: string, limit: number, offset: number) {

    }
    getRoom(room: string, limit: number, offset: number) {

    }

    addChat(userId: UserId, name: string, room: string, message:string) {

    }

    upvote(userId: UserId, room: string, chatId: string) {

    }

}
export interface FriendDto {
    userId: string;
    name: string;
    email: string;
    imageUrl?: string;
}


export interface FriendRequestDto {
    id: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    status: string;
    sentAt: string;
}

export interface SendFriendRequestDto {
    receiverId: string;
}
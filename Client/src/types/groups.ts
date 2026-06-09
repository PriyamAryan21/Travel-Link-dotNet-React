export interface CreateGroupDto {
    name: string;
    description: string;
    coverImageUrl?: string;
    memberIds: string[];
}

export interface GroupDto {
    id: string;
    name: string;
    description: string;
    coverImageUrl?: string;
    createdAt: string;
    createdByUserId: string;
    createdByName: string;
    members: GroupMemberDto[];
}

export interface GroupMemberDto {
    userId: string;
    userName: string;
    email: string;
    imageUrl: string;
    role: string;
    joinedAt: string;
}

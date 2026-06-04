export interface CreateGroupDto {
    name: string;
    description: string;
    coverImageUrl?: string;
    members: string[];
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
    role: string;
    joinedAt: string;
}

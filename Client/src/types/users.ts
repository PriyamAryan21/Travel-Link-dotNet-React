export interface UserProfileDto {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
}

export interface UserTripSummaryDto {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    coverImageUrl: string | null;
}

export interface UserGroupSummaryDto {
    id: string;
    name: string;
    coverImageUrl: string | null;
    memberCount: number;
}

export interface UserMutualFriendDto {
    id: string;
    name: string;
    imageUrl: string | null;
}

export interface UserProfileDetailDto {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
    createdAt: string;
    totalFriends: number;
    mutualFriends: number;
    mutualFriendsList: UserMutualFriendDto[];
    isFriend: boolean;
    createdTrips: UserTripSummaryDto[];
    createdGroups: UserGroupSummaryDto[];
}
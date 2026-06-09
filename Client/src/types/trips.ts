export interface TripDto {
    id: string;
    name: string;
    destination?: string;
    startDate: string;
    endDate: string;
    groupId: string;
    groupName: string;
    coverPhotoUrl?: string | null;
    hasItinerary: boolean;
}
export interface CreateTripDto {
    groupId: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
}
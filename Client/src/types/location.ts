export interface LocationUpdateDto {
    userId: string;
    userName: string;
    imageUrl: string | null;
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
    timestamp: string;
}
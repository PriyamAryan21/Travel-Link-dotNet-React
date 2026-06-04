export interface AddSuggestionDto {
    name: string;
    type: string;
    notes?: string;
}

export interface AddGenerateItineraryDto {
    groupId: string;
    destination: string;
    startDate: string;
    endDate: string;
    totalBudget: number;
    dailyHotelCostPerRoom?: number;
    numberOfRooms?: number;
    vehicleType?: string;
    vehicleCount?: number;
    isRental: boolean;
    dailyRentalCostPerVehicle?: number;
    dailyFuelCostPerVehicle?: number;
    note?: string;
}

export interface DroppedSuggestionDto {
    name: string;
    reason: string;
}

export interface GenerateItineraryDto {
    note: string | null;
}

export interface GroupItineraryStatusDto {
    requestId: string;
    destination: string;
    startDate: string;
    endDate: string;
    totalBudget: number;
    status: string;
    totalSuggestions: number;
    approvedSuggestions: number;
}

export interface ItineraryDayDto {
    id: string;
    dayNumber: number;
    date: string;
    title: string;
    weatherNote: string | null;
    items: ItineraryItemDto[];
}

export interface ItineraryItemDto {
    id: string;
    orderIndex: number;
    type: string;
    placeName: string;
    description: string;
    durationMinutes: number;
    notes: string;
    category: string;
    estimatedCostPerPerson: number | null;
    bookingSearchQuery: string | null;
    bookingType: string | null;
    isCompleted: boolean;
}

export interface ItineraryResultDto {
    id: string;
    requestId: string;
    destination: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    groupSize: number;
    generatedAt: string;
    totalBudget: number;
    hotelTotalCost: number;
    dailyHotelCost: number;
    numberOfNights: number;
    replacedExisting: boolean;
    vehicleTotalCost: number;
    estimatedActivityCost: number;
    estimatedTotalSpend: number;
    budgetRemaining: number;
    estimatedCostPerPerson: number;
    vehicleType: string | null;
    vehicleCount: number | null;
    dailyVehicleCost: number;
    days: ItineraryDayDto[];
    droppedSuggestions: DroppedSuggestionDto[];
}

export interface ReviewSuggestionDto {
    adminApproved: boolean | null;
}

export interface SuggestionDto {
    id: string;
    name: string;
    type: string;
    notes: string | null;
    adminApproved: boolean | null;
    voteCount: number;
    hasCurrentUserVoted: boolean;
    suggestedByName: string;
    suggestedByImageUrl: string | null;
    suggestedByUserId: string;
    createdAt: string;
}
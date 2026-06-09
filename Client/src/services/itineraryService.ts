import type { AddSuggestionDto, AutoGenerateItineraryDto, CreateItineraryRequestDto, GenerateItineraryDto, GroupItineraryStatusDto, ItineraryResultDto, ReviewSuggestionDto, SuggestionDto, UserItinerarySummaryDto } from "../types";
import api, { unwrap } from "./api";

const itineraryService = {
    createRequest: (dto: CreateItineraryRequestDto) =>
        unwrap<string>(api.post('itinerary/request', dto)),

    getTripStatus: (tripId: string) =>
        unwrap<GroupItineraryStatusDto | null>(api.get(`itinerary/${tripId}/status`)),

    deleteRequest: (requestId: string) =>
        unwrap<string>(api.delete(`itinerary/request/${requestId}`)),

    addSuggestion: (requestId: string, dto: AddSuggestionDto) =>
        unwrap<SuggestionDto>(api.post(`itinerary/${requestId}/suggest`, dto)),

    deleteSuggestion: (suggestionId: string) =>
        unwrap<string>(api.delete(`itinerary/suggestion/${suggestionId}`)),

    toggleVote: (suggestionId: string) =>
        unwrap<string>(api.post(`itinerary/suggestion/${suggestionId}/vote`)),

    reviewSuggestion: (suggestionId: string, dto: ReviewSuggestionDto) =>
        unwrap<SuggestionDto>(api.patch(`itinerary/suggestion/${suggestionId}/review`, dto)),

    getSuggestions: (requestId: string) =>
        unwrap<SuggestionDto[]>(api.get(`itinerary/${requestId}/suggestions`)),

    generate: (requestId: string, dto: GenerateItineraryDto) =>
        unwrap<ItineraryResultDto>(api.post(`itinerary/${requestId}/generate`, dto)),

    autoGenerate: (dto: AutoGenerateItineraryDto) =>
        unwrap<ItineraryResultDto>(api.post('itinerary/request/auto-generate', dto)),

    getResult: (requestId: string) =>
        unwrap<ItineraryResultDto>(api.get(`itinerary/${requestId}/result`)),

    deleteResult: (requestId: string) =>
        unwrap<string>(api.delete(`itinerary/${requestId}/result`)),

    toggleItemComplete: (itemId: string) =>
        unwrap<string>(api.patch(`itinerary/item/${itemId}/complete`)),

    getUserItineraries: () =>
        unwrap<UserItinerarySummaryDto[]>(api.get('itinerary/user')),
};

export default itineraryService;

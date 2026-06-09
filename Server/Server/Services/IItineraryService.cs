using Server.Common;
using Server.DTOs.Itinerary;

namespace Server.Services
{
    public interface IItineraryService
    {
        Task<ServiceResult<Guid>> CreateRequestAsync(Guid userId, CreateItineraryRequestDto dto);
        Task<ServiceResult<SuggestionDto>> AddSuggestionAsync(Guid userId, Guid requestId, AddSuggestionDto dto);
        Task<ServiceResult<bool>> DeleteSuggestionAsync(Guid userId, Guid suggestionId);
        Task<ServiceResult<bool>> ToggleVoteAsync(Guid userId, Guid suggestionId);
        Task<ServiceResult<bool>> ReviewSuggestionAsync(Guid userId, Guid suggestionId, ReviewSuggestionDto dto);
        Task<ServiceResult<List<SuggestionDto>>> GetSuggestionsAsync(Guid userId, Guid requestId);
        Task<ServiceResult<ItineraryResultDto>> GenerateItineraryAsync(Guid userId, Guid requestId, GenerateItineraryDto dto);
        Task<ServiceResult<ItineraryResultDto>> GetItineraryResultAsync(Guid userId, Guid requestId);
        Task<ServiceResult<ItineraryResultDto>> AutoGenerateItineraryAsync(Guid userId, AutoGenerateItineraryDto dto);
        Task<ServiceResult<bool>> DeleteItineraryRequestAsync(Guid userId, Guid requestId);
        Task<ServiceResult<bool>> DeleteGeneratedItineraryAsync(Guid userId, Guid requestId);
        Task<ServiceResult<GroupItineraryStatusDto?>> GetTripItineraryStatusAsync(Guid userId, Guid groupId);
        Task<ServiceResult<bool>> ToggleItemCompleteAsync(Guid userId, Guid itemId);
        Task<ServiceResult<List<UserItinerarySummaryDto>>> GetItinerariesByUserAsync(Guid userId);

    }
}

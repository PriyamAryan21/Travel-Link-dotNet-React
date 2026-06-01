using Azure.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Server.Common;
using Server.Data;
using Server.DTOs.Itinerary;
using Server.Models.Entities;
using System.Text;
using System.Text.Json;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Server.Services
{
    public class ItineraryService : IItineraryService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly HttpClient _http;

        public ItineraryService(AppDbContext db, IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _db = db;
            _config = config;
            _http = httpClientFactory.CreateClient();
        }

        public async Task<ServiceResult<SuggestionDto>> AddSuggestionAsync(Guid userId, Guid requestId, AddSuggestionDto dto)
        {
            var request = await _db.ItineraryRequests
                .FindAsync(requestId);

            if (request == null) return ServiceResult<SuggestionDto>.Fail("Itinerary request not found.");
            if (request.Status != "Open") return ServiceResult<SuggestionDto>.Fail("This itinerary is no longer accepting suggestions.");

            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == request.GroupId && m.UserId == userId);

            if(!isMember) return ServiceResult<SuggestionDto>.Fail("You are not a member of this group.");

            var suggestion = new PlaceSuggestion
            {
                ItineraryRequestId = requestId,
                SuggestedByUserId = userId,
                Name = dto.Name,
                Type = dto.Type,
                Notes = dto.Notes
            };

            var user = await _db.Users.FindAsync(userId);
            _db.PlaceSuggestions.Add(suggestion);
            await _db.SaveChangesAsync();

            var result = new SuggestionDto
            {
                Id = suggestion.Id,
                Name = suggestion.Name,
                Type = suggestion.Type,
                Notes = suggestion.Notes,
                SuggestedByUserId = suggestion.SuggestedByUserId,
                VoteCount = 0,
                HasCurrentUserVoted = false,
                SuggestedByName = user!.Name,
                SuggestedByImageUrl = user!.ImageUrl,
                AdminApproved = suggestion.AdminApproved
            };

            return ServiceResult<SuggestionDto>.Ok(result);
        }

        public async Task<ServiceResult<Guid>> CreateRequestAsync(Guid userId, CreateItineraryRequestDto dto)
        {
            var isAdmin = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == dto.GroupId 
                && m.UserId == userId 
                && m.Role == "Admin");

            if (!isAdmin) return ServiceResult<Guid>.Fail("Only group admins can create an Itinerary request.");

            var existing = await _db.ItineraryRequests
                .AnyAsync(r => r.GroupId == dto.GroupId);

            if (existing) return ServiceResult<Guid>.Fail("This group already has an active itinerary request. Delete it first to create a new one.");
            if (dto.StartDate.Date >= dto.EndDate.Date) return ServiceResult<Guid>.Fail("End date must be after start date");
            var memberCount = await _db.GroupMembers.CountAsync(m => m.GroupId == dto.GroupId);

            int? vehicleCount = dto.VehicleCount;
            if(vehicleCount == null && !string.IsNullOrEmpty(dto.VehicleType) && dto.VehicleType != "None")
            {
                vehicleCount = dto.VehicleType
                    switch
                {
                    "Scooty" or "Bike" => (int)Math.Ceiling(memberCount / 2.0),
                    "Car" => (int)Math.Ceiling(memberCount / 4.0),
                    "SUV" => (int)Math.Ceiling(memberCount / 7.0),
                    "Traveller" => 1,
                    _ => null
                };
            }

            var request = new ItineraryRequest
            {
                GroupId = dto.GroupId,
                CreatedByUserId = userId,
                Destination = dto.Destination,
                DailyHotelCostPerRoom = dto.DailyHotelCostPerRoom,
                NumberOfRooms = dto.NumberOfRooms,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TotalBudget = dto.TotalBudget,
                GroupSize = memberCount,
                VehicleType = dto.VehicleType,
                VehicleCount = vehicleCount,
                IsRental = dto.IsRental,
                DailyRentalCostPerVehicle = dto.DailyRentalCostPerVehicle,
                DailyFuelCostPerVehicle = dto.DailyFuelCostPerVehicle,
                Status = "Open"
            };
            _db.ItineraryRequests.Add(request);
            await _db.SaveChangesAsync();

            return ServiceResult<Guid>.Ok(request.Id);
        }

        public async Task<ServiceResult<bool>> DeleteSuggestionAsync(Guid userId, Guid suggestionId)
        {
            var suggestion = await _db.PlaceSuggestions.FindAsync(suggestionId);

            if (suggestion == null) return ServiceResult<bool>.Fail("Suggestion not found.");

            var request = await _db.ItineraryRequests.FindAsync(suggestion.ItineraryRequestId);

            if (request == null) return ServiceResult<bool>.Fail("Associated itinerary not found");

            var isAdmin = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == request.GroupId && m.UserId == userId && m.Role == "Admin");

            if (suggestion.SuggestedByUserId != userId && !isAdmin) return ServiceResult<bool>.Fail("You can only delete your own suggestions.");

            _db.PlaceSuggestions.Remove(suggestion);
            await _db.SaveChangesAsync();

            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<ItineraryResultDto>> GenerateItineraryAsync(Guid userId, Guid requestId, GenerateItineraryDto dto)
        {
            var request = await _db.ItineraryRequests.FindAsync(requestId);
            if (request == null) return ServiceResult<ItineraryResultDto>.Fail("Itinerary request not found.");

            var isAdmin = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == request.GroupId && m.UserId == userId && m.Role == "Admin");

            if (!isAdmin) return ServiceResult<ItineraryResultDto>.Fail("Only group admins can generate the itinerary.");

            bool replacedExisting = false;
            if(request.Status == "Generated")
            {
                var existing = await _db.GeneratedItineraries
                    .Include(g => g.Days)
                    .ThenInclude(d => d.Items)
                    .FirstOrDefaultAsync(g => g.ItineraryRequestId == requestId);

                if(existing != null)
                {
                    foreach(var day in existing.Days)
                    {
                        _db.ItineraryItems.RemoveRange(day.Items);
                    }
                    _db.ItineraryDays.RemoveRange(existing.Days);
                    _db.GeneratedItineraries.Remove(existing);
                    await _db.SaveChangesAsync();
                }
                replacedExisting = true;
                request.Status = "Open";
                await _db.SaveChangesAsync();
            }

            request.Status = "Generating";
            await _db.SaveChangesAsync();
            try
            {
                await RunGenerationAsync(request, dto.Note);
            }catch(Exception ex)
            {
                request.Status = "Open";
                await _db.SaveChangesAsync();
                return ServiceResult<ItineraryResultDto>.Fail(ex.Message);
            }
            var result = await GetItineraryResultAsync(userId, requestId);
            if (result.Success) result.Data.ReplacedExisting = replacedExisting;
            return result;
        }

        public async Task<ServiceResult<ItineraryResultDto>> GetItineraryResultAsync(Guid userId, Guid requestId)
        {
            var request = await _db.ItineraryRequests.FindAsync(requestId);
            if (request == null) return ServiceResult<ItineraryResultDto>.Fail("Itinerary request not found.");

            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == request.GroupId && m.UserId == userId);
            if (!isMember) return ServiceResult<ItineraryResultDto>.Fail("You are not a member of this group.");

            var itinerary = await _db.GeneratedItineraries
                .Include(g => g.Days)
                .ThenInclude(d => d.Items)
                .FirstOrDefaultAsync(g => g.ItineraryRequestId == requestId);

            if (itinerary == null) return ServiceResult<ItineraryResultDto>.Fail("Itinerary has not been generated yet.");

            var droppedList = string.IsNullOrWhiteSpace(itinerary.DroppedSuggestionsJson)
                ? new List<DroppedSuggestionDto>()
                : 
                JsonSerializer.Deserialize<List<DroppedSuggestionDto>>(itinerary.DroppedSuggestionsJson) ?? new();

            var totalDays = itinerary.Days.Count;
            var groupSize = request.GroupSize > 0 ? request.GroupSize : 1;

            decimal dailyVehicleCost = 0m;
            if(request.VehicleCount is > 0)
            {
                var rentalPerDay = (request.DailyRentalCostPerVehicle ?? 0) * request.VehicleCount.Value;
                var fuelPerDay = (request.DailyFuelCostPerVehicle ?? 0) * request.VehicleCount.Value; 
                dailyVehicleCost = rentalPerDay + fuelPerDay;
            }
            decimal vehicleTotalCost = dailyVehicleCost * totalDays;

            decimal activityCost = itinerary.Days
                .SelectMany(d => d.Items)
                .Sum(i => i.EstimatedCostPerPerson ?? 0) * groupSize;
            int numberOfNights = Math.Max(0, totalDays - 1);
            decimal dailyHotelCost = 0m;
            if(request.DailyHotelCostPerRoom is > 0 && request.NumberOfRooms is > 0)
            {
                dailyHotelCost = request.DailyHotelCostPerRoom.Value * request.NumberOfRooms.Value;
            }
            decimal hotelTotalCost = dailyHotelCost * numberOfNights;
            decimal totalSpend = vehicleTotalCost + hotelTotalCost + activityCost;
            decimal perPerson = totalSpend / groupSize;
            decimal remaining = request.TotalBudget - totalSpend;

            var result = new ItineraryResultDto
            {
                Id = itinerary.Id,
                RequestId = requestId,
                Destination = request.Destination,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                GeneratedAt = itinerary.GeneratedAt,
                TotalDays = totalDays,
                GroupSize = groupSize,
                TotalBudget = request.TotalBudget,
                VehicleTotalCost = vehicleTotalCost,
                HotelTotalCost = hotelTotalCost,
                DailyHotelCost = dailyHotelCost,
                NumberOfNights = numberOfNights,
                EstimatedActivityCost = activityCost,
                EstimatedTotalSpend = totalSpend,
                BudgetRemaining = remaining,
                EstimatedCostPerPerson = perPerson,
                VehicleType = request.VehicleType,
                VehicleCount = request.VehicleCount,
                DailyVehicleCost = dailyVehicleCost,
                Days = itinerary.Days.OrderBy(d => d.DayNumber).Select(d => new ItineraryDayDto
                {
                    Id = d.Id,
                    DayNumber = d.DayNumber,
                    Date = d.Date,
                    Title = d.Title,
                    WeatherNote = d.WeatherNote,
                    Items = d.Items.OrderBy(i => i.OrderIndex).Select(i => new ItineraryItemDto
                    {
                        Id = i.Id,
                        OrderIndex = i.OrderIndex,
                        PlaceName = i.PlaceName,
                        Description = i.Description,
                        Category = i.Category,
                        Type = i.Type,
                        DurationMinutes = i.DurationMinutes,
                        EstimatedCostPerPerson = i.EstimatedCostPerPerson,
                        Notes = i.Notes,
                        BookingSearchQuery = i.BookingSearchQuery,
                        BookingType = i.BookingType,
                        IsCompleted = i.IsCompleted
                    }).ToList()
                }).ToList(),
                DroppedSuggestions = droppedList
            };

            return ServiceResult<ItineraryResultDto>.Ok(result);
        }

        public async Task<ServiceResult<List<SuggestionDto>>> GetSuggestionsAsync(Guid userId, Guid requestId)
        {
            var request = await _db.ItineraryRequests.FindAsync(requestId);
            if (request == null) return ServiceResult<List<SuggestionDto>>.Fail("Itinerary request not found.");

            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == request.GroupId && m.UserId == userId);
            if(!isMember) return ServiceResult<List<SuggestionDto>>.Fail("You are not a member of this group.");

            var suggestions = await _db.PlaceSuggestions
                .Where(s => s.ItineraryRequestId == requestId)
                .Join(_db.Users,
                    s => s.SuggestedByUserId,
                    u => u.Id,
                    (s, u) => new SuggestionDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        Type = s.Type,
                        Notes = s.Notes,
                        SuggestedByUserId = s.SuggestedByUserId,
                        SuggestedByName = u.Name,
                        SuggestedByImageUrl = u.ImageUrl,
                        AdminApproved = s.AdminApproved,
                        CreatedAt = s.CreatedAt,
                        VoteCount = _db.SuggestionVotes.Count(v => v.SuggestionId == s.Id),
                        HasCurrentUserVoted = _db.SuggestionVotes.Any(v => v.SuggestionId == s.Id && v.UserId == userId)
                    })
                .OrderByDescending(s => s.AdminApproved == true)
                .ThenByDescending(s => s.VoteCount)
                .ToListAsync();
            return ServiceResult<List<SuggestionDto>>.Ok(suggestions);
        }

        public async Task<ServiceResult<bool>> ReviewSuggestionAsync(Guid userId, Guid suggestionId, ReviewSuggestionDto dto)
        {
            var suggestion = await _db.PlaceSuggestions.FindAsync(suggestionId);
            if (suggestion == null) return ServiceResult<bool>.Fail("Suggestion not found.");

            var request = await _db.ItineraryRequests.FindAsync(suggestion.ItineraryRequestId);

            var isAdmin = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == request!.GroupId && m.UserId == userId && m.Role == "Admin");

            if (!isAdmin) return ServiceResult<bool>.Fail("Only group admins can review suggestions.");

            suggestion.AdminApproved = dto.AdminApproved;
            await _db.SaveChangesAsync();

            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<bool>> ToggleItemCompleteAsync(Guid userId, Guid itemId)
        {
            var item = await _db.ItineraryItems
                .Include(i => i.Day)
                    .ThenInclude(d => d.Itinerary)
                .FirstOrDefaultAsync(i => i.Id == itemId);

            if (item == null) return ServiceResult<bool>.Fail("Item not found.");

            var requestId = item.Day.Itinerary.ItineraryRequestId;
            var request = await _db.ItineraryRequests.FindAsync(requestId);
            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == request!.GroupId && m.UserId == userId);
            if (!isMember) return ServiceResult<bool>.Fail("You are not a member of this group.");

            item.IsCompleted = !item.IsCompleted;
            await _db.SaveChangesAsync();

            return ServiceResult<bool>.Ok(item.IsCompleted);
        }
        public async Task<ServiceResult<GroupItineraryStatusDto?>> GetGroupItineraryStatusAsync(Guid userId, Guid groupId)
        {
            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == userId);
            if (!isMember) return ServiceResult<GroupItineraryStatusDto?>.Fail("You are not a member of this group.");

            var request = await _db.ItineraryRequests
                .FirstOrDefaultAsync(r => r.GroupId == groupId);

            if (request == null) return ServiceResult<GroupItineraryStatusDto?>.Ok(null); // no request yet

            var totalSuggestions = await _db.PlaceSuggestions
                .CountAsync(s => s.ItineraryRequestId == request.Id);
            var approvedSuggestions = await _db.PlaceSuggestions
                .CountAsync(s => s.ItineraryRequestId == request.Id && s.AdminApproved == true);

            return ServiceResult<GroupItineraryStatusDto?>.Ok(new GroupItineraryStatusDto
            {
                RequestId = request.Id,
                Destination = request.Destination,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                TotalBudget = request.TotalBudget,
                Status = request.Status,
                TotalSuggestions = totalSuggestions,
                ApprovedSuggestions = approvedSuggestions
            });
        }
        public async Task<ServiceResult<bool>> ToggleVoteAsync(Guid userId, Guid suggestionId)
        {
            var suggestion = await _db.PlaceSuggestions.FindAsync(suggestionId);
            if (suggestion == null) return ServiceResult<bool>.Fail("Suggestion not found.");

            var request = await _db.ItineraryRequests.FindAsync(suggestion!.ItineraryRequestId);
            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == request!.GroupId && m.UserId == userId);
            if (!isMember) return ServiceResult<bool>.Fail("You are not the member of this group.");

            var existingVote = await _db.SuggestionVotes
                .FirstOrDefaultAsync(v => v.SuggestionId == suggestionId && v.UserId == userId);

            if(existingVote != null)
            {
                _db.SuggestionVotes.Remove(existingVote);
                await _db.SaveChangesAsync();
                return ServiceResult<bool>.Ok(false);
            }

            var vote = new SuggestionVote
            {
                SuggestionId = suggestionId,
                UserId = userId
            };

            _db.SuggestionVotes.Add(vote);
            await _db.SaveChangesAsync();
            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<bool>> DeleteItineraryRequestAsync(Guid userId, Guid requestId)
        {
            var request = await _db.ItineraryRequests.FindAsync(requestId);
            if (request == null) return ServiceResult<bool>.Fail("Itinerary request not found.");

            var isAdmin = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == request.GroupId && m.UserId == userId && m.Role == "Admin");

            if (!isAdmin) return ServiceResult<bool>.Fail("Only group admins can delete an itinerary request.");

            await DeleteRequestCoreAsync(requestId);
            return ServiceResult<bool>.Ok(true);
        }
        private async Task RunGenerationAsync(ItineraryRequest request, string? note)
        {
            string weatherSummary = "Weather data unavailable";
            try
            {
                var geoUrl = $"https://geocoding-api.open-meteo.com/v1/search?name={Uri.EscapeDataString(request.Destination)}&count=1&language=en&format=json";
                var geoResponse = await _http.GetStringAsync(geoUrl);
                var geoDoc = JsonDocument.Parse(geoResponse);
                var results = geoDoc.RootElement.GetProperty("results");

                if (results.GetArrayLength() > 0)
                {
                    var place = results[0];
                    double lat = place.GetProperty("latitude").GetDouble();
                    double lon = place.GetProperty("longitude").GetDouble();

                    string startStr = request.StartDate.ToString("yyyy-MM-dd");
                    string endStr = request.EndDate.ToString("yyyy-MM-dd");

                    var weatherUrl = $"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&start_date={startStr}&end_date={endStr}&timezone=auto";

                    var weatherResponse = await _http.GetStringAsync(weatherUrl);
                    var weatherDoc = JsonDocument.Parse(weatherResponse);
                    var daily = weatherDoc.RootElement.GetProperty("daily");
                    var dates = daily.GetProperty("time").EnumerateArray().Select(d => d.GetString()).ToList();
                    var maxTemps = daily.GetProperty("temperature_2m_max").EnumerateArray().Select(t => t.GetDouble()).ToList();
                    var minTemps = daily.GetProperty("temperature_2m_min").EnumerateArray().Select(t => t.GetDouble()).ToList();
                    var precip = daily.GetProperty("precipitation_sum").EnumerateArray().Select(p => p.GetDouble()).ToList();
                    var sb = new StringBuilder();
                    for (int i = 0; i < dates.Count; i++)
                    {
                        sb.Append($"{dates[i]}: {minTemps[i]}–{maxTemps[i]}°C, rain {precip[i]}mm. ");
                    }
                    weatherSummary = sb.ToString().Trim();
                }
            }
            catch
            {

            }

            var allSuggestions = await _db.PlaceSuggestions
                .Where(s => s.ItineraryRequestId == request.Id && s.AdminApproved != false)
                .OrderByDescending(s => s.AdminApproved == true)
                .ThenByDescending(s => _db.SuggestionVotes.Count(v => v.SuggestionId == s.Id))
                .ToListAsync();
            var totalDays = Math.Max(1, (int)(request.EndDate.Date - request.StartDate.Date).TotalDays + 1);

            int vehicleCount = request.VehicleCount ?? 1;
            decimal dailyRental = (request.DailyRentalCostPerVehicle ?? 0) * vehicleCount;
            decimal dailyFuel = (request.DailyFuelCostPerVehicle ?? 0) * vehicleCount;
            decimal dailyVehicleCost = dailyRental + dailyFuel;
            decimal tripVehicleCost = dailyVehicleCost * totalDays;
            int numberOfNights = Math.Max(0, totalDays - 1);
            decimal dailyHotelCost = (request.DailyHotelCostPerRoom ?? 0) * (request.NumberOfRooms ?? 0);
            decimal tripHotelCost = dailyHotelCost * numberOfNights;
            decimal remainingBudget = request.TotalBudget - tripVehicleCost - tripHotelCost;
            int groupSize = request.GroupSize > 0 ? request.GroupSize : 1;
            decimal avgPerPersonPerDay = remainingBudget > 0 ? Math.Round(remainingBudget / groupSize / totalDays, 0) : 0;

            string vehicleContext;
            if (string.IsNullOrEmpty(request.VehicleType) || request.VehicleType == "None")
            {
                vehicleContext = $"The group uses public transport. Include local transport legs(bus/auto/taxi) as separate itinerary items with realistic cost. Category for these items must be \"{ItineraryCategories.Transport}\".";
            }
            else
            {
                vehicleContext = $"The group travels by {request.VehicleType} ({vehicleCount} vehicle(s), {(request.IsRental == true ? "rental" : "own")}). Vehicle cost is pre-budgeted (₹{dailyVehicleCost}/day total. Do NOT add transport cost items for vehicle travel.)";
            }
            string accommodationContext;
            if (dailyHotelCost <= 0)
            {
                accommodationContext = "Accommodation: The group has free accommodation(staying with friends / family or pre - arranged).Do NOT add any hotel or accommodation cost items.";
            }
            else
            {
                accommodationContext = $"Accommodation: Hotel cost is pre-budgeted (₹{dailyHotelCost}/night for {request.NumberOfRooms} room(s) = ₹{tripHotelCost} total for {numberOfNights} night(s)). Do NOT add hotel cost items — accommodation is already accounted for.";
            }
            var approvedList = allSuggestions.Where(s => s.AdminApproved == true).Select(s => $"{s.Name}({s.Type})");
            var neutralList = allSuggestions.Where(s => s.AdminApproved == null).Select(s => $"{s.Name}({s.Type})");
            string noteText = string.IsNullOrWhiteSpace(note) ? "" : $"Special note: {note}.";

            string prompt = $@"You are a travel itinerary planner. Build a realistic day-by-day itinerary in JSON only — no markdown, no explanation, no code fences.

Trip Details:
- Destination: {request.Destination}
- Duration: {totalDays} days ({request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd})
- Group size: {groupSize} people
- Total budget for the trip: ₹{request.TotalBudget}
- Budget available for activities (after vehicle costs): ₹{remainingBudget} (≈₹{avgPerPersonPerDay}/person/day)
- Weather forecast: {weatherSummary}

Transport:
{vehicleContext}

Accommodation:
{accommodationContext}

Places to include:
- Admin-approved (MUST include): {(approvedList.Any() ? string.Join(", ", approvedList) : "None")}
- Suggested by group (include as many as realistic): {(neutralList.Any() ? string.Join(", ", neutralList) : "None")}

{noteText}

Rules:
- Fit activities realistically by travel time and hours available per day
- Drop items that don't fit — list them in dropped_suggestions with a short reason
- Spread costs across days to stay within the remaining budget
- Each day must have a short descriptive title (e.g. ""Arrival & Old City Exploration"")
- Use ONLY these categories for items: {ItineraryCategories.PromptList}

Respond with ONLY this JSON shape:
{{
  ""days"": [
    {{
      ""day_number"": 1,
      ""date"": ""yyyy-MM-dd"",
      ""title"": ""Day theme or summary"",
      ""weather_note"": ""short weather note"",
      ""items"": [
        {{
          ""name"": """",
          ""category"": ""one of the allowed categories"",
          ""description"": ""1-2 sentences describing what this involves"",
          ""duration_minutes"": 0,
          ""estimated_cost_per_person"": 0.0,
          ""notes"": """",
          ""booking_search_query"": """",
          ""booking_type"": ""hotel|transport|activity|food|none""
        }}
      ]
    }}
  ],
  ""dropped_suggestions"": [
    {{ ""name"": """", ""reason"": """" }}
  ]
}}";



            var apiKey = _config["Gemini:ApiKey"];
            var model = _config["Gemini:Model"] ?? "gemini-1.5-flash";
            var geminiUrl = $"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[]{ new { text = prompt} } }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var geminiResponse = await _http.PostAsync(geminiUrl, content);

            if (!geminiResponse.IsSuccessStatusCode)
            {
                var errorBody = await geminiResponse.Content.ReadAsStringAsync();
                request.Status = "Open";
                await _db.SaveChangesAsync();
                throw new InvalidOperationException($"Gemini API call failed. ({geminiResponse.StatusCode}):({errorBody}).");
            }

            var responseJson = await geminiResponse.Content.ReadAsStringAsync();
            var responseDoc = JsonDocument.Parse(responseJson);

            var rawText = responseDoc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString()!;

            var cleanedText = rawText.Trim();
            if (cleanedText.StartsWith("```"))
            {
                var firsrNewLine = cleanedText.IndexOf('\n');
                if (firsrNewLine >= 0) cleanedText = cleanedText[(firsrNewLine + 1)..];
                var lastFence = cleanedText.LastIndexOf("```");
                if (lastFence >= 0) cleanedText = cleanedText[..lastFence];

                cleanedText = cleanedText.Trim();

            }

            var parsed = JsonDocument.Parse(cleanedText).RootElement;
            var daysArr = parsed.GetProperty("days");
            string? droppedJson = null;
            if (parsed.TryGetProperty("dropped_suggestions", out var droppedEl)) droppedJson = droppedEl.GetRawText();

            var itinerary = new GeneratedItinerary
            {
                ItineraryRequestId = request.Id,
                GeneratedAt = DateTime.Now,
                DroppedSuggestionsJson = droppedJson,
                TotalDays = daysArr.GetArrayLength(),
            };
            _db.GeneratedItineraries.Add(itinerary);
            await _db.SaveChangesAsync();

            int dayCounter = 0;
            foreach (var dayEl in daysArr.EnumerateArray())
            {
                dayCounter++;
                string dayTitle = dayEl.TryGetProperty("title", out var titleEl)
                ? (titleEl.GetString() ?? $"Day {dayCounter}")
                : $"Day {dayCounter}";

                var day = new ItineraryDay
                {
                    ItineraryId = itinerary.Id,
                    DayNumber = dayEl.TryGetProperty("day_number", out var dn) ? dn.GetInt32() : dayCounter,
                    Date = dayEl.TryGetProperty("date", out var dt) ? DateTime.Parse(dt.GetString()!) : request.StartDate.AddDays(dayCounter - 1),
                    Title = dayTitle,
                    WeatherNote = dayEl.TryGetProperty("weather_note", out var wn) ? wn.GetString() : null
                };
                _db.ItineraryDays.Add(day);
                await _db.SaveChangesAsync();

                int orderIndex = 0;
                foreach (var itemEl in dayEl.GetProperty("items").EnumerateArray())
                {
                    string category = itemEl.TryGetProperty("category", out var catEl) ? (catEl.GetString() ?? "") : "";
                    var item = new ItineraryItem
                    {
                        DayId = day.Id,
                        OrderIndex = orderIndex++,
                        PlaceName = itemEl.TryGetProperty("name", out var nm) ? nm.GetString()! : "Unnamed",
                        Category = category,
                        Description = itemEl.TryGetProperty("description", out var dsc) ? dsc.GetString() : "",
                        DurationMinutes = itemEl.TryGetProperty("duration_minutes", out var dur) ? dur.GetInt32() : 0,
                        EstimatedCostPerPerson = itemEl.TryGetProperty("estimated_cost_per_person", out var cost) ? cost.GetDecimal() : 0,
                        Notes = itemEl.TryGetProperty("notes", out var n) ? n.GetString() : null,
                        BookingSearchQuery = itemEl.TryGetProperty("booking_search_query", out var bq) ? bq.GetString() : null,
                        BookingType = itemEl.TryGetProperty("booking_type", out var bt) ? bt.GetString() : null
                    };
                    _db.ItineraryItems.Add(item);
                }
                await _db.SaveChangesAsync();
            }
            request.Status = "Generated";
            await _db.SaveChangesAsync();
        }

        public async Task<ServiceResult<ItineraryResultDto>> AutoGenerateItineraryAsync(
    Guid userId, AutoGenerateItineraryDto dto)
        {
            var isAdmin = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == dto.GroupId && m.UserId == userId && m.Role == "Admin");
            if (!isAdmin) return ServiceResult<ItineraryResultDto>.Fail("Only group admins can generate an itinerary.");
            if (dto.EndDate.Date <= dto.StartDate.Date)
                return ServiceResult<ItineraryResultDto>.Fail("End date must be after start date.");
            var existingRequest = await _db.ItineraryRequests
                .FirstOrDefaultAsync(r => r.GroupId == dto.GroupId);
            bool replacedExisting = existingRequest != null;
            if (existingRequest != null)
            {
                await DeleteRequestCoreAsync(existingRequest.Id);
            }
            var memberCount = await _db.GroupMembers.CountAsync(m => m.GroupId == dto.GroupId);

            int? vehicleCount = dto.VehicleCount;
            if (vehicleCount == null && !string.IsNullOrEmpty(dto.VehicleType) && dto.VehicleType != "None")
            {
                vehicleCount = dto.VehicleType switch {
                    "Scooty" or "Bike" => (int)Math.Ceiling(memberCount / 2.0),
                    "Car" => (int)Math.Ceiling(memberCount / 4.0),
                    "SUV" => (int)Math.Ceiling(memberCount / 7.0),
                    "Traveller" => 1,
                    _ => null
                };  
            }

            var request = new ItineraryRequest
            {
                GroupId = dto.GroupId,
                CreatedByUserId = userId,
                Destination = dto.Destination,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TotalBudget = dto.TotalBudget,
                GroupSize = memberCount,
                DailyHotelCostPerRoom = dto.DailyHotelCostPerRoom,
                NumberOfRooms = dto.NumberOfRooms,
                VehicleType = dto.VehicleType,
                VehicleCount = vehicleCount,
                IsRental = dto.IsRental,
                DailyRentalCostPerVehicle = dto.DailyRentalCostPerVehicle,
                DailyFuelCostPerVehicle = dto.DailyFuelCostPerVehicle,
                Status = "Generating"
            };
            _db.ItineraryRequests.Add(request);
            await _db.SaveChangesAsync();
            try
            {
                await RunGenerationAsync(request, dto.Note);
                _db.ChangeTracker.Clear();
            }
            catch (Exception ex)
            {
                request.Status = "Open";
                await _db.SaveChangesAsync();
                return ServiceResult<ItineraryResultDto>.Fail(ex.Message);
            }
            var result = await GetItineraryResultAsync(userId, request.Id);
            if (result.Success)
            {
                result.Data!.ReplacedExisting = replacedExisting;
            }

            return result;
            
        }

        private async Task DeleteRequestCoreAsync(Guid requestId)
        {
            var suggestionIds = await _db.PlaceSuggestions
                .Where(s => s.ItineraryRequestId == requestId)
                .Select(s => s.Id)
                .ToListAsync();

            if (suggestionIds.Any())
            {
                var votes = await _db.SuggestionVotes
                    .Where(v => suggestionIds.Contains(v.SuggestionId))
                    .ToListAsync();
                _db.SuggestionVotes.RemoveRange(votes);
            }

            var suggestions = await _db.PlaceSuggestions
                .Where(s => s.ItineraryRequestId == requestId)
                .ToListAsync();
            _db.PlaceSuggestions.RemoveRange(suggestions);

            var itinerary = await _db.GeneratedItineraries
                .Include(g => g.Days).ThenInclude(d => d.Items)
                .FirstOrDefaultAsync(g => g.ItineraryRequestId == requestId);

            if (itinerary != null)
            {
                foreach (var day in itinerary.Days) _db.ItineraryItems.RemoveRange(day.Items);
                _db.ItineraryDays.RemoveRange(itinerary.Days);
                _db.GeneratedItineraries.Remove(itinerary);
            }

            var request = await _db.ItineraryRequests.FindAsync(requestId);
            if (request != null) _db.ItineraryRequests.Remove(request);

            await _db.SaveChangesAsync();
        }


    }
}

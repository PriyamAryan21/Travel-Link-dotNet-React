using System;
using System.Collections.Generic;

namespace Server.DTOs.Users
{
    public class UserTripSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? CoverImageUrl { get; set; }
    }

    public class UserGroupSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public int MemberCount { get; set; }
    }

    public class UserMutualFriendDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }

    public class UserProfileDetailDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public int TotalFriends { get; set; }
        public int MutualFriends { get; set; }
        public List<UserMutualFriendDto> MutualFriendsList { get; set; } = new();
        public bool IsFriend { get; set; }

        public List<UserTripSummaryDto> CreatedTrips { get; set; } = new();
        public List<UserGroupSummaryDto> CreatedGroups { get; set; } = new();
    }
}

using Microsoft.EntityFrameworkCore;
using Server.Models.Entities;

namespace Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {

        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Indexes for Performance Optimization
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
            modelBuilder.Entity<Trip>().HasIndex(t => t.StartDate);
            modelBuilder.Entity<Expense>().HasIndex(e => e.Date);
            modelBuilder.Entity<FriendRequest>().HasIndex(fr => fr.Status);
            modelBuilder.Entity<Group>().HasIndex(g => g.CreatedAt);

            //Friend System Module
            modelBuilder.Entity<FriendRequest>()
                .HasOne(fr => fr.Sender)
                .WithMany(u => u.SentFriendRequests)
                .HasForeignKey(fr => fr.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FriendRequest>()
                .HasOne(fr => fr.Receiver)
                .WithMany(u => u.ReceivedFriendRequests)
                .HasForeignKey(fr => fr.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);


            //Group Module
            modelBuilder.Entity<Group>()
                .HasOne(g => g.CreatedBy)
                .WithMany(u => u.CreatedGroups)
                .HasForeignKey(g => g.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<GroupMember>()
                .HasOne(gm => gm.User)
                .WithMany(u => u.GroupMemberships)
                .HasForeignKey(gm => gm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<GroupMember>()
                .HasOne(gm => gm.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(gm => gm.GroupId)
                .OnDelete(DeleteBehavior.Cascade);


            //Expense Module
            modelBuilder.Entity<Expense>()
                .Property(e => e.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ExpenseSplit>()
                .Property(es => es.AmountOwed)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ItineraryRequest>()
                .Property(r => r.TotalBudget)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ItineraryRequest>()
                .Property(r=> r.DailyHotelCostPerRoom)
                .HasPrecision(18, 2);
            
            modelBuilder.Entity<ItineraryRequest>()
                .Property(r => r.DailyRentalCostPerVehicle)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ItineraryRequest>()
                .Property(r => r.DailyFuelCostPerVehicle)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ItineraryItem>()
                .Property(i => i.EstimatedCostPerPerson)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Expense>()
                .HasOne(e => e.PaidBy)
                .WithMany(u => u.Expenses)
                .HasForeignKey(e => e.PaidByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Expense>()
                .HasOne(e => e.Group)
                .WithMany(g => g.Expenses)
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade).IsRequired(false);

            modelBuilder.Entity<ExpenseSplit>()
                .HasOne(es => es.Expense)
                .WithMany(e => e.Splits)
                .HasForeignKey(es => es.ExpenseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ExpenseSplit>()
                .HasOne(es => es.User)
                .WithMany(u => u.ExpenseSplits)
                .HasForeignKey(es => es.UserId)
                .OnDelete(DeleteBehavior.Restrict);



            //Itinerary Builder Module

            modelBuilder.Entity<ItineraryRequest>()
                .HasOne(r => r.CreatedBy)
                .WithMany()
                .HasForeignKey(r => r.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PlaceSuggestion>()
                .HasOne(ps => ps.ItineraryRequest)
                .WithMany(r => r.Suggestions)
                .HasForeignKey(ps => ps.ItineraryRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PlaceSuggestion>()
                .HasOne(ps => ps.SuggestedBy)
                .WithMany()
                .HasForeignKey(v => v.SuggestedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SuggestionVote>()
                .HasOne(v => v.Suggestion)
                .WithMany(ps => ps.Votes)
                .HasForeignKey(v => v.SuggestionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SuggestionVote>()
                .HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SuggestionVote>()
                .HasIndex(v => new { v.SuggestionId, v.UserId })
                .IsUnique();

            modelBuilder.Entity<GeneratedItinerary>()
                .HasOne(gi => gi.ItineraryRequest)
                .WithOne(r => r.GeneratedItinerary)
                .HasForeignKey<GeneratedItinerary>(gi => gi.ItineraryRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ItineraryDay>()
                .HasOne(d => d.Itinerary)
                .WithMany(gi => gi.Days)
                .HasForeignKey(d => d.ItineraryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ItineraryItem>()
                .HasOne(i => i.Day)
                .WithMany(d => d.Items)
                .HasForeignKey(i => i.DayId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Trip>()
                .HasOne(t => t.Group)
                .WithMany(g => g.Trips)
                .HasForeignKey(t => t.GroupId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Trip>()
                .HasOne(t => t.CreatedBy)
                .WithMany()
                .HasForeignKey(t => t.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ItineraryRequest>()
                .HasOne(i => i.Trip)
                .WithOne(t => t.ItineraryRequest)
                .HasForeignKey<ItineraryRequest>(r => r.TripId)
                .OnDelete(DeleteBehavior.Cascade);

            

            modelBuilder.Entity<ActivityLog>()
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ActivityLog>()
                .HasOne(a => a.Group)
                .WithMany()
                .HasForeignKey(a => a.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

        }
        public DbSet<User> Users { get; set; }
        public DbSet<FriendRequest> FriendRequests { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<ExpenseSplit> ExpenseSplits { get; set; }
        public DbSet<Trip> Trips { get; set; }
        public DbSet<ItineraryRequest> ItineraryRequests { get; set; }
        public DbSet<PlaceSuggestion> PlaceSuggestions { get; set; }
        public DbSet<SuggestionVote> SuggestionVotes { get; set; }
        public DbSet<GeneratedItinerary> GeneratedItineraries { get; set; }
        public DbSet<ItineraryDay> ItineraryDays { get; set; }
        public DbSet<ItineraryItem> ItineraryItems { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        }
}

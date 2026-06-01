namespace Server.Common
{
    public static class ItineraryCategories
    {
        public const string Sightseeing = "Sightseeing";
        public const string Food = "Food";
        public const string Transport = "Transport";
        public const string Accommodation = "Accommodation";
        public const string Activity = "Activity";
        public const string Shopping = "Shopping";
        public const string Nature = "Nature";
        public const string Culture = "Culture";
        public const string Rest = "Rest";
        public const string NightLife = "NightLife";

        public static readonly string[] All =
        {
            Sightseeing, Food, Transport, Accommodation,
            Activity, Shopping, Nature, Culture, Rest, NightLife
        };
        public static string PromptList => string.Join(", ", All);
    }
}

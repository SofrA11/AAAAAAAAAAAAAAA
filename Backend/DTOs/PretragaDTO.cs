using Backend.Models;

namespace Backend.DTOs
{
    public class PretragaDTO
    {
        public string? Search { get; set; }
        public DestinationType? DestinationType { get; set; }        // kategorija/tip
        public double? PriceMin { get; set; }
        public double? PriceMax { get; set; }
        public double? MinRating { get; set; }
        public int? DrzavaId { get; set; }
        public string? DrzavaName { get; set; }
        public int? GradId { get; set; }
        public string? GradName { get; set; }
        public int? PocetakSezone { get; set; }
        public int? KrajSezone { get; set; }
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 8;
    }
}
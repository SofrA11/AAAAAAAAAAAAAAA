using System.Data;

namespace Backend.DTOs
{
    public class ReviewDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public int DestinacijaId { get; set; }
        public string Komentar { get; set; } = string.Empty;
        public int Ocena { get; set; }
        public DateTime DatumKreiranja { get; set; }
        public int LikeNum { get; set; }
        public int DislikeNum { get; set; }
    }
}
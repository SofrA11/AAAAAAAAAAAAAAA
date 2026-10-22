using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class Review
    {
        public int Id { get; set; }
        public string KorisnikId { get; set; } = string.Empty;
        [JsonIgnore]
        public Korisnik Korisnik { get; set; } = null!;
        public int DestinacijaId { get; set; }
        [JsonIgnore]
        public Destinacija Destinacija { get; set; } = null!;
        public string Komentar { get; set; } = string.Empty;
        public int Ocena { get; set; }
        public DateTime DatumKreiranja { get; set; } = DateTime.UtcNow;
        public int LikeNum { get; set; }
        public int DislikeNum { get; set; }
    }
}


using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models
{
    public class Like
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }
        public string KorisnikId { get; set; } = string.Empty;
        [JsonIgnore]
        public Korisnik Korisnik { get; set; } = null!;
        public int ReviewId { get; set; }
        [JsonIgnore]
        public Review Review { get; set; } = null!;
        public bool Liked { get; set; } //True = Like, False = Dislike. Required polje.
    }
}
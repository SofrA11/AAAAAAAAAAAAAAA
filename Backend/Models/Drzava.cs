using System.Text.Json.Serialization;
namespace Backend.Models
{
    public class Drzava
    {
        public int Id { get; set; }
        public string Naziv { get; set; } = string.Empty;

        [JsonIgnore]
        public ICollection<Grad> Gradovi { get; set; } = new List<Grad>();
    }
}
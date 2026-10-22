using System.Text.Json.Serialization;
namespace Backend.Models
{
    public class Grad
    {
        public int Id { get; set; }
        public string Naziv { get; set; } = string.Empty;
        public int DrzavaId { get; set; }
        public Drzava? Drzava { get; set; }
        [JsonIgnore]
        public ICollection<Destinacija> Destinacije { get; set; } = new List<Destinacija>();
    }
}
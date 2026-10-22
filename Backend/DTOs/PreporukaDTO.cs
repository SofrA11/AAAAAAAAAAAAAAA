namespace Backend.DTOs
{
    public class PreporukaDto
    {
        public int DestinacijaId { get; set; }
        public string Naziv { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Tip { get; set; } = string.Empty;
        public double ProsecnaOcena { get; set; }
        public double PredvidjenaOcena { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}
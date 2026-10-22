namespace Backend.Models
{
    // Tip destinacije
    public enum DestinationType
    {
        Grad,
        Plaza,
        Planina,
        KulturnaDestinacija,
        PrirodnaAtrakcija,
        AvanturistickaDestinacija
    }

    public class Destinacija
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DestinationType Type { get; set; } // Tip destinacije [Grad,Plaza,Planina,KulturnaDestinacija,PrirodnaAtrakcija,AvanturistickaDestinacija]
        public double AverageRating { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public double PriceMin { get; set; }
        public double PriceMax { get; set; }
        public double PocetakSezone { get; set; }
        public double KrajSezone { get; set; }

        public int GradId { get; set; }
        public Grad? Grad { get; set; }
    }
}
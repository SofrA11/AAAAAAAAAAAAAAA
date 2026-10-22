namespace Backend.DTOs
{
    public class RegistracijaDTO
    {
        public string Ime { get; set; } = string.Empty;
        public string Prezime { get; set; } = string.Empty;
        public string KorisnickoIme { get; set; } = string.Empty;
        public int GodinaRodjenja { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Lozinka { get; set; } = string.Empty;
    }
}
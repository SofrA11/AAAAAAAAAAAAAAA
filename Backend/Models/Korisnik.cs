using Microsoft.AspNetCore.Identity;
namespace Backend.Models
{
    public class Korisnik : IdentityUser
    {
        public string Ime { get; set; } = string.Empty;
        public string Prezime { get; set; } = string.Empty;
        public int GodinaRodjenja { get; set; }
        // Id, username, mail, passwordHash ... se nasledjuju iz IdentityUser

    }
}
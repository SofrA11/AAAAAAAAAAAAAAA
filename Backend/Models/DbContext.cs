using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class AplikacioniDbContext : IdentityDbContext<Korisnik>
    {
        public AplikacioniDbContext(DbContextOptions<AplikacioniDbContext> options)
            : base(options)
        {
        }
        public DbSet<Korisnik> Korisnici { get; set; }
        public DbSet<Destinacija> Destinacije { get; set; }

        public DbSet<Review> Reviews { get; set; }
        public DbSet<Like> Likes { get; set; }
        public DbSet<Grad> Gradovi { get; set; }
        public DbSet<Drzava> Drzave { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Review>()
                .HasOne(r => r.Korisnik)
                .WithMany()
                .HasForeignKey(r => r.KorisnikId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
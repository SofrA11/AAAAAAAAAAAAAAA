using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Services
{
    public class DrzavaService
    {
        private readonly AplikacioniDbContext _context;

        public DrzavaService(AplikacioniDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<object>> GetNaziviDrzavaAsync()
        {
            return await _context.Drzave
                .AsNoTracking()
                .OrderBy(d => d.Naziv)
                .Select(d => new
                {
                    d.Id,
                    d.Naziv
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<object>> GetDrzaveAsync()
        {
            return await _context.Drzave
                .Include(d => d.Gradovi)
                .Select(d => new
                {
                    d.Id,
                    d.Naziv,
                    Gradovi = d.Gradovi.Select(g => new
                    {
                        g.Id,
                        g.Naziv
                    })
                })
                .ToListAsync();
        }

        public async Task<object?> GetDrzavaByIdAsync(int id)
        {
            return await _context.Drzave
                .Include(d => d.Gradovi)
                .Where(d => d.Id == id)
                .Select(d => new
                {
                    d.Id,
                    d.Naziv,
                    Gradovi = d.Gradovi.Select(g => new
                    {
                        g.Id,
                        g.Naziv
                    })
                })
                .FirstOrDefaultAsync();
        }

        public async Task<(Drzava? Result, string? ErrorMessage)> CreateDrzavaAsync(Drzava drzava)
        {
            if (string.IsNullOrWhiteSpace(drzava.Naziv))
            {
                return (null, "Naziv države je obavezan.");
            }

            var postoji = await _context.Drzave.AnyAsync(d => d.Naziv.ToLower() == drzava.Naziv.ToLower());
            if (postoji)
            {
                return (null, "Država sa ovim nazivom već postoji.");
            }

            _context.Drzave.Add(drzava);
            await _context.SaveChangesAsync();

            return (drzava, null);
        }

        public async Task<bool> UpdateDrzavaAsync(int id, Drzava drzava)
        {
            var existingDrzava = await _context.Drzave.FindAsync(id);
            if (existingDrzava == null)
            {
                return false;
            }

            existingDrzava.Naziv = drzava.Naziv;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteDrzavaAsync(int id)
        {
            var drzava = await _context.Drzave.FindAsync(id);
            if (drzava == null)
            {
                return false;
            }

            _context.Drzave.Remove(drzava);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
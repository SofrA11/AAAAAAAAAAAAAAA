using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Services
{
    public class GradService
    {
        private readonly AplikacioniDbContext _context;

        public GradService(AplikacioniDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<object>> GetGradoviByDrzavaIdAsync(int? drzavaId)
        {
            var query = _context.Gradovi
                .Include(g => g.Drzava)
                .AsQueryable();

            if (drzavaId.HasValue)
            {
                query = query.Where(g => g.DrzavaId == drzavaId.Value);
            }

            return await query
                .Select(g => new
                {
                    g.Id,
                    g.Naziv,
                    Drzava = g.Drzava == null ? null : new
                    {
                        g.Drzava.Id,
                        g.Drzava.Naziv
                    }
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<object>> GetGradoviFilteredAsync(int? drzavaId, string? search, int limit)
        {
            var query = _context.Gradovi.AsNoTracking();

            if (drzavaId.HasValue)
            {
                query = query.Where(g => g.DrzavaId == drzavaId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(g => g.Naziv.Contains(search));
            }

            return await query
                .OrderBy(g => g.Naziv)
                .Select(g => new
                {
                    g.Id,
                    g.Naziv,
                    Drzava = g.Drzava == null ? null : new
                    {
                        g.Drzava.Id,
                        g.Drzava.Naziv
                    }
                })
                .Take(limit)
                .ToListAsync();
        }

        public async Task<object?> GetGradByIdAsync(int id)
        {
            return await _context.Gradovi
                .Include(g => g.Drzava)
                .Where(g => g.Id == id)
                .Select(g => new
                {
                    g.Id,
                    g.Naziv,
                    Drzava = g.Drzava == null ? null : new
                    {
                        g.Drzava.Id,
                        g.Drzava.Naziv
                    }
                })
                .FirstOrDefaultAsync();
        }

        public async Task<(Grad? Result, string? ErrorMessage)> CreateGradAsync(Grad grad)
        {
            if (string.IsNullOrWhiteSpace(grad.Naziv))
            {
                return (null, "Naziv grada je obavezan.");
            }

            var drzavaExists = await _context.Drzave.AnyAsync(d => d.Id == grad.DrzavaId);
            if (!drzavaExists)
            {
                return (null, "Izabrana država ne postoji.");
            }

            _context.Gradovi.Add(grad);
            await _context.SaveChangesAsync();

            return (grad, null);
        }

        public async Task<(bool Success, string? ErrorMessage, bool IsNotFound)> UpdateGradAsync(int id, Grad grad)
        {
            var existingGrad = await _context.Gradovi.FindAsync(id);
            if (existingGrad == null)
            {
                return (false, null, true);
            }

            var drzavaExists = await _context.Drzave.AnyAsync(d => d.Id == grad.DrzavaId);
            if (!drzavaExists)
            {
                return (false, "Izabrana država ne postoji.", false);
            }

            existingGrad.Naziv = grad.Naziv;
            existingGrad.DrzavaId = grad.DrzavaId;

            await _context.SaveChangesAsync();

            return (true, null, false);
        }

        public async Task<bool> DeleteGradAsync(int id)
        {
            var grad = await _context.Gradovi.FindAsync(id);
            if (grad == null)
            {
                return false;
            }

            _context.Gradovi.Remove(grad);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Services
{
    public class DestinacijaService
    {
        private readonly AplikacioniDbContext _context;

        public DestinacijaService(AplikacioniDbContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<object> Data, object Pagination)> SearchDestinacijeAsync(PretragaDTO searchDto)
        {
            var query = _context.Destinacije.AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchDto.Search))
            {
                var searchTerm = searchDto.Search.Trim().ToLower();
                query = query.Where(d => d.Name.ToLower().Contains(searchTerm) ||
                                         (d.Description != null && d.Description.ToLower().Contains(searchTerm)));
            }

            if (searchDto.DestinationType != null)
            {
                query = query.Where(d => d.Type == searchDto.DestinationType);
            }

            if (searchDto.PriceMin.HasValue)
            {
                query = query.Where(d => d.PriceMin >= searchDto.PriceMin.Value);
            }

            if (searchDto.PriceMax.HasValue)
            {
                query = query.Where(d => d.PriceMax <= searchDto.PriceMax.Value);
            }

            if (searchDto.MinRating.HasValue && searchDto.MinRating.Value >= 0)
            {
                query = query.Where(d => d.AverageRating >= searchDto.MinRating.Value);
            }

            if (searchDto.GradId.HasValue)
            {
                query = query.Where(d => d.GradId == searchDto.GradId.Value);
            }
            else if (searchDto.DrzavaId.HasValue)
            {
                query = query.Where(d => d.Grad.DrzavaId == searchDto.DrzavaId.Value);
            }

            if (searchDto.PocetakSezone.HasValue)
            {
                query = query.Where(d => d.KrajSezone >= searchDto.PocetakSezone.Value);
            }

            if (searchDto.KrajSezone.HasValue)
            {
                query = query.Where(d => d.PocetakSezone <= searchDto.KrajSezone.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchDto.Search))
            {
                var searchTerm = searchDto.Search.Trim().ToLower();
                query = query.OrderByDescending(d => d.Name.ToLower().Contains(searchTerm))
                             .ThenByDescending(d => d.Name.ToLower().StartsWith(searchTerm))
                             .ThenBy(d => d.Name);
            }
            else
            {
                query = query.OrderByDescending(d => d.AverageRating).ThenBy(d => d.Name);
            }

            var totalItems = await query.CountAsync();

            var items = await query
                .Skip((searchDto.Page - 1) * searchDto.Limit)
                .Take(searchDto.Limit)
                .ToListAsync();

            var pagination = new
            {
                CurrentPage = searchDto.Page,
                ItemsPerPage = searchDto.Limit,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling((double)totalItems / searchDto.Limit)
            };

            return (items, pagination);
        }

        public async Task<IEnumerable<object>> GetDestinationsAsync(DestinationType? type, string? search)
        {
            var query = _context.Destinacije
                .Include(d => d.Grad)
                    .ThenInclude(g => g!.Drzava)
                .AsQueryable();

            if (type.HasValue)
            {
                query = query.Where(d => d.Type == type.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(d => d.Name.ToLower().Contains(searchLower) ||
                                         (d.Grad != null && d.Grad.Naziv.ToLower().Contains(searchLower)) ||
                                         (d.Grad != null && d.Grad.Drzava != null && d.Grad.Drzava.Naziv.ToLower().Contains(searchLower)));
            }

            var destinations = await query.ToListAsync();

            return destinations.Select(d => new
            {
                d.Id,
                d.Name,
                d.Description,
                Type = d.Type.ToString(),
                d.AverageRating,
                d.ImageUrl,
                d.PriceMin,
                d.PriceMax,
                d.PocetakSezone,
                d.KrajSezone,
                Grad = d.Grad == null ? null : new
                {
                    d.Grad.Id,
                    d.Grad.Naziv,
                    Drzava = d.Grad.Drzava == null ? null : new
                    {
                        d.Grad.Drzava.Id,
                        d.Grad.Drzava.Naziv
                    }
                }
            });
        }

        public async Task<object?> GetDestinationByIdAsync(int id)
        {
            var d = await _context.Destinacije
                .Include(d => d.Grad)
                    .ThenInclude(g => g!.Drzava)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (d == null) return null;

            return new
            {
                d.Id,
                d.Name,
                d.Description,
                Type = d.Type.ToString(),
                d.AverageRating,
                d.ImageUrl,
                d.PriceMin,
                d.PriceMax,
                d.PocetakSezone,
                d.KrajSezone,
                Grad = d.Grad == null ? null : new
                {
                    d.Grad.Id,
                    d.Grad.Naziv,
                    Drzava = d.Grad.Drzava == null ? null : new
                    {
                        d.Grad.Drzava.Id,
                        d.Grad.Drzava.Naziv
                    }
                }
            };
        }

        public async Task<(IEnumerable<object> Data, object Pagination)> GetPagedDestinacijeAsync(int page, int limit, bool ascending)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 8;

            var query = _context.Destinacije.AsQueryable();

            query = ascending
                ? query.OrderBy(d => d.AverageRating).ThenBy(d => d.Id)
                : query.OrderByDescending(d => d.AverageRating).ThenBy(d => d.Id);

            var totalItems = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var pagination = new
            {
                CurrentPage = page,
                ItemsPerPage = limit,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling((double)totalItems / limit)
            };

            return (items, pagination);
        }

        public async Task<IEnumerable<object>> GetUserReviewedDestinationsAsync(string email)
        {
            var userEmail = email.Trim().ToLower();

            return await _context.Reviews
                .Include(r => r.Destinacija)
                    .ThenInclude(d => d!.Grad)
                        .ThenInclude(g => g!.Drzava)
                .Where(r => r.Korisnik != null && r.Korisnik.Email.ToLower() == userEmail)
                .OrderByDescending(r => r.DatumKreiranja)
                .Select(r => new
                {
                    ReviewId = r.Id,
                    UserOcena = r.Ocena,
                    UserKomentar = r.Komentar,
                    DatumOcenjivanja = r.DatumKreiranja,

                    Destinacija = r.Destinacija == null ? null : new
                    {
                        r.Destinacija.Id,
                        r.Destinacija.Name,
                        r.Destinacija.Description,
                        Type = r.Destinacija.Type.ToString(),
                        r.Destinacija.AverageRating,
                        r.Destinacija.ImageUrl,
                        r.Destinacija.PriceMin,
                        r.Destinacija.PriceMax,
                        r.Destinacija.PocetakSezone,
                        r.Destinacija.KrajSezone,

                        Grad = r.Destinacija.Grad == null ? null : new
                        {
                            r.Destinacija.Grad.Id,
                            r.Destinacija.Grad.Naziv,
                            Drzava = r.Destinacija.Grad.Drzava == null ? null : new
                            {
                                r.Destinacija.Grad.Drzava.Id,
                                r.Destinacija.Grad.Drzava.Naziv
                            }
                        }
                    }
                })
                .ToListAsync();
        }

        public async Task<(Destinacija? Result, string? ErrorMessage)> CreateDestinationAsync(Destinacija destinacija)
        {
            if (destinacija.PriceMin > destinacija.PriceMax)
            {
                return (null, "PriceMin ne može biti veći od PriceMax.");
            }

            var gradExists = await _context.Gradovi.AnyAsync(g => g.Id == destinacija.GradId);
            if (!gradExists)
            {
                return (null, "Izabrani grad ne postoji u bazi.");
            }

            _context.Destinacije.Add(destinacija);
            await _context.SaveChangesAsync();

            return (destinacija, null);
        }

        public async Task<(bool Success, string? ErrorMessage, bool NotFound)> UpdateDestinationAsync(int id, Destinacija destinacija)
        {
            var existingDestination = await _context.Destinacije.FindAsync(id);
            if (existingDestination == null)
            {
                return (false, null, true);
            }

            if (destinacija.PriceMin > destinacija.PriceMax)
            {
                return (false, "PriceMin ne može biti veći od PriceMax.", false);
            }

            var gradExists = await _context.Gradovi.AnyAsync(g => g.Id == destinacija.GradId);
            if (!gradExists)
            {
                return (false, "Izabrani grad ne postoji u bazi.", false);
            }

            existingDestination.Name = destinacija.Name;
            existingDestination.GradId = destinacija.GradId;
            existingDestination.Description = destinacija.Description;
            existingDestination.Type = destinacija.Type;
            existingDestination.ImageUrl = destinacija.ImageUrl;
            existingDestination.PriceMin = destinacija.PriceMin;
            existingDestination.PriceMax = destinacija.PriceMax;
            existingDestination.PocetakSezone = destinacija.PocetakSezone;
            existingDestination.KrajSezone = destinacija.KrajSezone;

            await _context.SaveChangesAsync();

            return (true, null, false);
        }

        public async Task<bool> DeleteDestinationAsync(int id)
        {
            var destinacija = await _context.Destinacije.FindAsync(id);
            if (destinacija == null)
            {
                return false;
            }

            _context.Destinacije.Remove(destinacija);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
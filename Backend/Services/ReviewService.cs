using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Services
{
    public class ReviewServiceResult<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? ErrorMessage { get; set; }
        public bool IsNotFound { get; set; }
        public bool IsBadRequest { get; set; }

        public static ReviewServiceResult<T> Ok(T data) => new() { Success = true, Data = data };
        public static ReviewServiceResult<T> NotFound(string message) => new() { Success = false, IsNotFound = true, ErrorMessage = message };
        public static ReviewServiceResult<T> BadRequest(string message) => new() { Success = false, IsBadRequest = true, ErrorMessage = message };
    }

    public class ReviewsService
    {
        private readonly AplikacioniDbContext _context;

        public ReviewsService(AplikacioniDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Review>> GetReviewsAsync()
        {
            return await _context.Reviews
                .Include(r => r.Korisnik)
                .Include(r => r.Destinacija)
                .ToListAsync();
        }

        public async Task<Review?> GetReviewByIdAsync(int id)
        {
            return await _context.Reviews
                .Include(r => r.Korisnik)
                .Include(r => r.Destinacija)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<IEnumerable<ReviewDto>> GetReviewsByDestinacijaAsync(int destinacijaId)
        {
            return await _context.Reviews
                .Where(r => r.DestinacijaId == destinacijaId)
                .OrderByDescending(r => r.DatumKreiranja)
                .Select(r => new ReviewDto
                {
                    Id = r.Id,
                    DestinacijaId = r.DestinacijaId,
                    Komentar = r.Komentar,
                    Ocena = (int)r.Ocena,
                    DatumKreiranja = r.DatumKreiranja,
                    Email = r.Korisnik != null ? r.Korisnik.Email : string.Empty,
                    Username = r.Korisnik != null ? r.Korisnik.UserName : "Korisnik",

                    LikeNum = _context.Likes.Count(l => l.ReviewId == r.Id && l.Liked),
                    DislikeNum = _context.Likes.Count(l => l.ReviewId == r.Id && !l.Liked)
                })
                .ToListAsync();
        }

        public async Task<ReviewServiceResult<Review>> CreateReviewAsync(ReviewDto dto)
        {
            if (dto.Ocena < 1 || dto.Ocena > 5)
            {
                return ReviewServiceResult<Review>.BadRequest("Ocena mora biti između 1 i 5.");
            }

            var korisnik = await _context.Korisnici.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (korisnik == null)
            {
                return ReviewServiceResult<Review>.BadRequest("Korisnik sa navedenim email-om nije pronađen.");
            }

            var review = new Review
            {
                KorisnikId = korisnik.Id,
                DestinacijaId = dto.DestinacijaId,
                Komentar = dto.Komentar,
                Ocena = dto.Ocena,
                DatumKreiranja = DateTime.UtcNow,
                LikeNum = 0,
                DislikeNum = 0
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            await AzurirajProsecnuOcenuDestinacije(review.DestinacijaId);

            return ReviewServiceResult<Review>.Ok(review);
        }

        private async Task AzurirajProsecnuOcenuDestinacije(int destinacijaId)
        {
            var destinacija = await _context.Destinacije.FindAsync(destinacijaId);
            if (destinacija == null) return;

            var recenzijeDestinacije = await _context.Reviews
                .Where(r => r.DestinacijaId == destinacijaId)
                .ToListAsync();

            int m_i = recenzijeDestinacije.Count;

            if (m_i == 0)
            {
                destinacija.AverageRating = 0;
                await _context.SaveChangesAsync();
                return;
            }

            double A_i = recenzijeDestinacije.Average(r => r.Ocena);

            double S = await _context.Reviews.AnyAsync()
                ? await _context.Reviews.AverageAsync(r => r.Ocena)
                : 0;

            var sveRecenzije = await _context.Reviews.ToListAsync();
            int ukupanBrojOcena = sveRecenzije.Count;

            int ukupanBrojDestinacija = await _context.Destinacije.CountAsync();

            double m_avg = ukupanBrojDestinacija > 0
                ? (double)ukupanBrojOcena / ukupanBrojDestinacija
                : 0;

            if (m_avg == 0) m_avg = 1;

            double bayesAvg = (m_i * A_i + m_avg * S) / (m_i + m_avg);

            destinacija.AverageRating = Math.Round(bayesAvg, 2);

            await _context.SaveChangesAsync();
        }

        public async Task<ReviewServiceResult<bool>> UpdateReviewAsync(int id, Review review)
        {
            var existingReview = await _context.Reviews.FindAsync(id);
            if (existingReview == null)
            {
                return ReviewServiceResult<bool>.NotFound("Recenzija nije pronađena.");
            }

            if (review.Ocena < 1 || review.Ocena > 5)
            {
                return ReviewServiceResult<bool>.BadRequest("Ocena mora biti između 1 i 5.");
            }

            existingReview.Komentar = review.Komentar;
            existingReview.Ocena = review.Ocena;

            await _context.SaveChangesAsync();

            return ReviewServiceResult<bool>.Ok(true);
        }

        public async Task<ReviewServiceResult<bool>> DeleteReviewAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return ReviewServiceResult<bool>.NotFound("Recenzija nije pronađena.");
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return ReviewServiceResult<bool>.Ok(true);
        }

        public async Task<ReviewServiceResult<int>> LikeReviewAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return ReviewServiceResult<int>.NotFound("Recenzija nije pronađena.");
            }

            review.LikeNum += 1;
            await _context.SaveChangesAsync();

            return ReviewServiceResult<int>.Ok(review.LikeNum);
        }

        public async Task<ReviewServiceResult<int>> DislikeReviewAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return ReviewServiceResult<int>.NotFound("Recenzija nije pronađena.");
            }

            review.DislikeNum += 1;
            await _context.SaveChangesAsync();

            return ReviewServiceResult<int>.Ok(review.DislikeNum);
        }
    }
}
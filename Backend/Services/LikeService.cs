using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Services
{
    public class ServiceResult<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? ErrorMessage { get; set; }
        public bool IsNotFound { get; set; }
        public bool IsBadRequest { get; set; }

        public static ServiceResult<T> Ok(T data) => new() { Success = true, Data = data };
        public static ServiceResult<T> NotFound(string message) => new() { Success = false, IsNotFound = true, ErrorMessage = message };
        public static ServiceResult<T> BadRequest(string message) => new() { Success = false, IsBadRequest = true, ErrorMessage = message };
    }

    public class LikesService
    {
        private readonly AplikacioniDbContext _context;

        public LikesService(AplikacioniDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<ToggleReactionResponseDto>> ToggleReactionAsync(LikeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return ServiceResult<ToggleReactionResponseDto>.BadRequest("Email je obavezan.");
            }

            var korisnik = await _context.Korisnici.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (korisnik == null)
            {
                return ServiceResult<ToggleReactionResponseDto>.NotFound("Korisnik sa datim email-om nije pronađen.");
            }

            var review = await _context.Reviews.FindAsync(dto.ReviewId);
            if (review == null)
            {
                return ServiceResult<ToggleReactionResponseDto>.NotFound("Recenzija nije pronađena.");
            }

            var postojeciLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.ReviewId == dto.ReviewId && l.KorisnikId == korisnik.Id);

            string statusAkcije;

            if (postojeciLike == null)
            {
                _context.Likes.Add(new Like
                {
                    KorisnikId = korisnik.Id,
                    ReviewId = dto.ReviewId,
                    Liked = dto.Liked
                });
                statusAkcije = dto.Liked ? "Dodat lajk" : "Dodat dislajk";
            }
            else if (postojeciLike.Liked == dto.Liked)
            {
                _context.Likes.Remove(postojeciLike);
                statusAkcije = "Reakcija uklonjena";
            }
            else
            {
                postojeciLike.Liked = dto.Liked;
                statusAkcije = dto.Liked ? "Promenjeno u lajk" : "Promenjeno u dislajk";
            }

            await _context.SaveChangesAsync();

            review.LikeNum = await _context.Likes.CountAsync(l => l.ReviewId == dto.ReviewId && l.Liked);
            review.DislikeNum = await _context.Likes.CountAsync(l => l.ReviewId == dto.ReviewId && !l.Liked);

            await _context.SaveChangesAsync();

            var response = new ToggleReactionResponseDto
            {
                Message = statusAkcije,
                LikeNum = review.LikeNum,
                DislikeNum = review.DislikeNum
            };

            return ServiceResult<ToggleReactionResponseDto>.Ok(response);
        }

        public async Task<bool?> GetUserReactionAsync(int reviewId, string korisnikId)
        {
            var like = await _context.Likes
                .FirstOrDefaultAsync(l => l.ReviewId == reviewId && l.KorisnikId == korisnikId);

            if (like == null)
            {
                return null;
            }

            return like.Liked; // true = Like, false = Dislike
        }

        public async Task<ServiceResult<ReviewReactionsResponseDto>> GetReviewReactionsAsync(int reviewId)
        {
            var reviewExists = await _context.Reviews.AnyAsync(r => r.Id == reviewId);
            if (!reviewExists)
            {
                return ServiceResult<ReviewReactionsResponseDto>.NotFound("Recenzija nije pronađena.");
            }

            var likesCount = await _context.Likes.CountAsync(l => l.ReviewId == reviewId && l.Liked);
            var dislikesCount = await _context.Likes.CountAsync(l => l.ReviewId == reviewId && !l.Liked);

            var response = new ReviewReactionsResponseDto
            {
                ReviewId = reviewId,
                LikeNum = likesCount,
                DislikeNum = dislikesCount
            };

            return ServiceResult<ReviewReactionsResponseDto>.Ok(response);
        }
    }
}
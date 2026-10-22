using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{

    public class PreporukaService
    {
        private readonly AplikacioniDbContext _context;
        public PreporukaService(AplikacioniDbContext context)
        {
            _context = context;
        }

        public async Task<List<PreporukaDto>> GetRecommendationsForUserAsync(string targetKorisnikId, int topN = 5)
        {
            var allReviews = await _context.Set<Review>()
                .Include(r => r.Destinacija)
                .AsNoTracking()
                .ToListAsync();

            //KorisnikId -> Dictionary<DestinacijaId, Ocena>
            var userRatingsMap = allReviews
                .GroupBy(r => r.KorisnikId)
                .ToDictionary(
                    g => g.Key,
                    g => g.ToDictionary(r => r.DestinacijaId, r => (double)r.Ocena)
                );

            const int thresholdM = 7;

            bool hasUser = userRatingsMap.ContainsKey(targetKorisnikId);
            var targetUserRatings = hasUser ? userRatingsMap[targetKorisnikId] : new Dictionary<int, double>();
            int userReviewCount = targetUserRatings.Count;

            if (!hasUser || userReviewCount == 0)
            {
                return await GetTopRatedDestinationsFallbackAsync(topN);
            }

            var predictions = new List<PreporukaDto>();
            var targetUserRatedDestIds = targetUserRatings.Keys.ToHashSet();

            // Item-Based Collaborative Filtering
            if (userReviewCount < thresholdM)
            {
                // destinacije sa 3<= ocena <=5)
                var positiveRatedItems = targetUserRatings
                    .Where(r => r.Value >= 3 && r.Value <= 5)
                    .ToDictionary(r => r.Key, r => r.Value);

                var unratedDestinations = allReviews
                    .Select(r => r.Destinacija)
                    .Where(d => d != null && !targetUserRatedDestIds.Contains(d.Id))
                    .GroupBy(d => d.Id)
                    .Select(g => g.First())
                    .ToDictionary(d => d.Id, d => d);

                foreach (var (destId, destinacija) in unratedDestinations)
                {
                    double weightedRatingSum = 0;
                    double similaritySum = 0;

                    //Uporedjivanje neocenjene destinacije sa destinacijama koje nije posetio
                    foreach (var (ratedDestId, userRating) in positiveRatedItems)
                    {
                        double similarity = CalculateItemCosineSimilarity(ratedDestId, destId, userRatingsMap);

                        if (similarity > 0)
                        {
                            weightedRatingSum += similarity * userRating;
                            similaritySum += similarity;
                        }
                    }

                    if (similaritySum > 0)
                    {
                        double predictedRating = weightedRatingSum / similaritySum;

                        predictions.Add(new PreporukaDto
                        {
                            DestinacijaId = destId,
                            Naziv = destinacija.Name,
                            ImageUrl = destinacija.ImageUrl,
                            Tip = destinacija.Type.ToString(),
                            ProsecnaOcena = destinacija.AverageRating,
                            PredvidjenaOcena = Math.Round(predictedRating, 2),
                            Description = destinacija.Description
                        });
                    }
                }
            }
            // User-Based Collaborative Filtering
            else
            {
                double targetUserAvg = targetUserRatings.Values.Average();

                var similarities = new Dictionary<string, double>();

                foreach (var (otherUserId, otherRatings) in userRatingsMap)
                {
                    if (otherUserId == targetKorisnikId) continue;

                    double similarity = CalculateUserCosineSimilarity(targetUserRatings, otherRatings);

                    if (similarity > 0)
                    {
                        similarities[otherUserId] = similarity;
                    }
                }

                var unratedDestinations = allReviews
                    .Select(r => r.Destinacija)
                    .Where(d => d != null && !targetUserRatedDestIds.Contains(d.Id))
                    .GroupBy(d => d.Id)
                    .Select(g => g.First())
                    .ToDictionary(d => d.Id, d => d);

                foreach (var (destId, destinacija) in unratedDestinations)
                {
                    double weightedRatingSum = 0;
                    double similaritySum = 0;

                    foreach (var (otherUserId, similarity) in similarities)
                    {
                        var otherRatings = userRatingsMap[otherUserId];

                        if (otherRatings.TryGetValue(destId, out double otherRating))
                        {
                            double otherUserAvg = otherRatings.Values.Average();

                            weightedRatingSum += similarity * (otherRating - otherUserAvg);
                            similaritySum += similarity;
                        }
                    }

                    if (similaritySum > 0)
                    {
                        double predictedRating = targetUserAvg + (weightedRatingSum / similaritySum);

                        predictions.Add(new PreporukaDto
                        {
                            DestinacijaId = destId,
                            Naziv = destinacija.Name,
                            ImageUrl = destinacija.ImageUrl,
                            Tip = destinacija.Type.ToString(),
                            ProsecnaOcena = destinacija.AverageRating,
                            PredvidjenaOcena = Math.Round(predictedRating, 2),
                            Description = destinacija.Description
                        });
                    }
                }
            }

            var primaryRecommendations = predictions
                .OrderByDescending(p => p.PredvidjenaOcena)
                .Take(topN)
                .ToList();


            if (primaryRecommendations.Count < topN)
            {
                var missingCount = topN - primaryRecommendations.Count;
                var existingIds = primaryRecommendations
                    .Select(r => r.DestinacijaId)
                    .Union(targetUserRatedDestIds)
                    .ToHashSet();

                var fallbackRecommendations = await GetTopRatedDestinationsFallbackAsync(missingCount, existingIds);
                primaryRecommendations.AddRange(fallbackRecommendations);
            }

            return primaryRecommendations;
        }

        private double CalculateUserCosineSimilarity(Dictionary<int, double> user1Ratings, Dictionary<int, double> user2Ratings)
        {
            var commonKeys = user1Ratings.Keys.Intersect(user2Ratings.Keys).ToList();
            if (!commonKeys.Any()) return 0;

            double dotProduct = 0;
            double norm1 = 0;
            double norm2 = 0;

            foreach (var key in commonKeys)
            {
                dotProduct += user1Ratings[key] * user2Ratings[key];
            }

            foreach (var rating in user1Ratings.Values)
            {
                norm1 += rating * rating;
            }

            foreach (var rating in user2Ratings.Values)
            {
                norm2 += rating * rating;
            }

            if (norm1 == 0 || norm2 == 0) return 0;

            return dotProduct / (Math.Sqrt(norm1) * Math.Sqrt(norm2));
        }

        private double CalculateItemCosineSimilarity(int item1Id, int item2Id, Dictionary<string, Dictionary<int, double>> userRatingsMap)
        {
            double dotProduct = 0;
            double norm1 = 0;
            double norm2 = 0;

            foreach (var (_, ratings) in userRatingsMap)
            {
                bool has1 = ratings.TryGetValue(item1Id, out double val1);
                bool has2 = ratings.TryGetValue(item2Id, out double val2);

                if (has1 && has2)
                {
                    dotProduct += val1 * val2;
                }
                if (has1)
                {
                    norm1 += val1 * val1;
                }
                if (has2)
                {
                    norm2 += val2 * val2;
                }
            }

            if (norm1 == 0 || norm2 == 0) return 0;

            return dotProduct / (Math.Sqrt(norm1) * Math.Sqrt(norm2));
        }
        private async Task<List<PreporukaDto>> GetTopRatedDestinationsFallbackAsync(int count, HashSet<int> excludedDestinationIds = null)
        {
            excludedDestinationIds ??= new HashSet<int>();

            var query = _context.Set<Destinacija>()
                .AsNoTracking();

            var allDestinations = await query.ToListAsync();


            var topDestinations = allDestinations
                .Where(d => !excludedDestinationIds.Contains(d.Id))
                .OrderByDescending(d => d.AverageRating)
                .Take(count)
                .Select(d => new PreporukaDto
                {
                    DestinacijaId = d.Id,
                    Naziv = d.Name,
                    ImageUrl = d.ImageUrl,
                    Tip = d.Type.ToString(),
                    ProsecnaOcena = d.AverageRating,
                    PredvidjenaOcena = d.AverageRating,
                    Description = d.Description
                })
                .ToList();

            return topDestinations;
        }
    }
}
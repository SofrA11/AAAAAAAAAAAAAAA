using System.Security.Cryptography;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services
{

    public class PreporukaService
    {
        private readonly AplikacioniDbContext _context;
        public PreporukaService(AplikacioniDbContext context)
        {
            _context = context;
        }
        #region Recomedations
        public async Task<List<PreporukaDto>> GetRecomedationsAsync(string activeUserId, int topN = 5, int topK = 5)
        {
            bool uslov = true;
            var users = await _context.Users.Select(u => u.Id).ToListAsync();
            var destIds = await _context.Destinacije.Select(d => d.Id).ToListAsync();
            var reviews = await _context.Reviews.ToListAsync();

            int n = users.Count;
            int m = destIds.Count;

            if (n == 0 || m == 0) return new List<PreporukaDto>();

            // 1. Napravi userItemMatrix
            double[,] userItemMatrix = CreateUserItemMatrix(n, m, users, destIds, reviews, out var userIndexMap, out var destIndexMap);

            if (!userIndexMap.ContainsKey(activeUserId))
                throw new ArgumentException("Aktivni korisnik ne postoji.");

            int activeUserIdx = userIndexMap[activeUserId];
            List<PreporukaDto> rez;
            if (uslov)
            {
                rez = await GetUserBasedRecommendationsAsync(activeUserIdx, userItemMatrix, userIndexMap, destIndexMap, topN, topK);
            }
            else
            {//itemBased
                rez = await GetItemBasedRecommendationsAsync(activeUserIdx, userItemMatrix, userIndexMap, destIndexMap, topN, topK);
            }
            return new List<PreporukaDto>();
        }
        #endregion
        #region UserBased
        public async Task<List<PreporukaDto>> GetUserBasedRecommendationsAsync(int activeUserIdx, double[,] userItemMatrix, Dictionary<string, int> userIndexMap, Dictionary<int, int> destIndexMap, int topN = 5, int topK = 5)
        {

            int n, m;
            n = userItemMatrix.GetLength(0);
            m = userItemMatrix.GetLength(1);
            // 2. Napravi nonRatedDestinations
            var nonRatedDestinations = GetNonRatedDestinations(userItemMatrix, activeUserIdx, m);

            // 3. Izračunaj sličnosti i pronađi komšiluk
            var similarities = CalculateUserSimilarities(userItemMatrix, activeUserIdx, n, m);//vektor slicnosti [0.25,0.5,0.09...]
            var topNeighbors = similarities.OrderByDescending(s => s.Similarity).Take(topN).ToList();

            double activeUserAvgRating = CalculateUserAverage(userItemMatrix, activeUserIdx);
            var recommendationsVector = new Dictionary<int, double>();

            // Računanje predviđenih ocena
            foreach (var dest in nonRatedDestinations)
            {
                double brojilac = 0;
                double imenilac = 0;

                //Formula iz rada
                foreach (var neighbor in topNeighbors)
                {
                    int k = neighbor.UserIndex;
                    double sim = neighbor.Similarity;

                    if (userItemMatrix[k, dest] > 0)
                    {
                        double neighborAvg = CalculateUserAverage(userItemMatrix, k);
                        brojilac += sim * (userItemMatrix[k, dest] - neighborAvg);
                        imenilac += Math.Abs(sim);
                    }
                }

                double rez = activeUserAvgRating;
                if (imenilac > 0)
                {
                    rez = activeUserAvgRating + (brojilac / imenilac);
                }
                //Kraj formule 

                recommendationsVector[dest] = rez;
            }

            // Sortiranje i uzimanje topK preporuka
            var finalRecommendations = recommendationsVector
                .OrderByDescending(r => r.Value)
                .Take(topK)
                .ToList();

            // Mapiranje nazad na DTO objekte
            var recommendedDestIds = finalRecommendations.Select(r => destIndexMap.First(x => x.Value == r.Key).Key).ToList();
            var destinationsFromDb = await _context.Destinacije
                .Where(d => recommendedDestIds.Contains(d.Id))
                .ToListAsync();

            return recommendedDestIds
                .Select(id => destinationsFromDb.First(d => d.Id == id))
                .Select(d => new PreporukaDto
                {
                    Naziv = d.Name,
                    Description = d.Description,
                    ImageUrl = d.ImageUrl,
                    Tip = d.Type.ToString(),
                    ProsecnaOcena = d.AverageRating,
                    PredvidjenaOcena = recommendationsVector[destIndexMap[d.Id]],
                })
                .ToList();
        }
        private double CalculateCosineSimilarity(double[,] matrix, int u1, int u2, int m)
        {
            double dotProduct = 0, norm1 = 0, norm2 = 0;
            for (int j = 0; j < m; j++)
            {
                double val1 = matrix[u1, j];
                double val2 = matrix[u2, j];

                dotProduct += val1 * val2;
                norm1 += val1 * val1;
                norm2 += val2 * val2;
            }
            if (norm1 == 0 || norm2 == 0) return 0.0;
            return dotProduct / (Math.Sqrt(norm1) * Math.Sqrt(norm2));
        }
        #endregion
        #region PomocneMetode

        private double[,] CreateUserItemMatrix(int n, int m, List<string> users, List<int> destIds, List<Review> reviews,
            out Dictionary<string, int> userIndexMap, out Dictionary<int, int> destIndexMap)
        {
            userIndexMap = users.Select((id, index) => new { id, index }).ToDictionary(x => x.id, x => x.index);
            destIndexMap = destIds.Select((id, index) => new { id, index }).ToDictionary(x => x.id, x => x.index);

            double[,] matrix = new double[n, m];

            foreach (var r in reviews)
            {
                if (userIndexMap.ContainsKey(r.KorisnikId) && destIndexMap.ContainsKey(r.DestinacijaId))
                {
                    int uIdx = userIndexMap[r.KorisnikId];
                    int dIdx = destIndexMap[r.DestinacijaId];
                    matrix[uIdx, dIdx] = r.Ocena;
                }
            }

            return matrix;
        }

        private List<int> GetNonRatedDestinations(double[,] matrix, int activeUserIdx, int m)
        {
            var nonRated = new List<int>();
            for (int j = 0; j < m; j++)
            {
                if (matrix[activeUserIdx, j] == 0)
                {
                    nonRated.Add(j);
                }
            }
            return nonRated;
        }

        private double CalculateUserAverage(double[,] matrix, int userIdx)
        {
            int m = matrix.GetLength(1);
            double sum = 0;
            int count = 0;
            for (int j = 0; j < m; j++)
            {
                if (matrix[userIdx, j] > 0)
                {
                    sum += matrix[userIdx, j];
                    count++;
                }
            }
            return count > 0 ? sum / count : 0.0;
        }

        private List<(int UserIndex, double Similarity)> CalculateUserSimilarities(double[,] matrix, int activeUserIdx, int n, int m)
        {
            var similarities = new List<(int UserIndex, double Similarity)>();

            for (int i = 0; i < n; i++)
            {
                if (i == activeUserIdx) continue;
                double sim = CalculateCosineSimilarity(matrix, activeUserIdx, i, m);
                similarities.Add((i, sim));
            }

            return similarities;
        }
        private List<(int UserIndex, double Similarity)> CalculateItemSimilarities(double[,] matrix, int activeDestIdx)
        {
            int n, m;
            n = matrix.GetLength(0);
            m = matrix.GetLength(1);
            var similarities = new List<(int ItemIndex, double Similarity)>();

            for (int i = 0; i < m; i++)
            {
                double sim = CalculateAdjustedCosineSimilarity(matrix, activeDestIdx, i);
                similarities.Add((i, sim));
            }

            return similarities;
        }

        #endregion


        #region ItemBased
        public async Task<List<PreporukaDto>> GetItemBasedRecommendationsAsync(int activeUserIdx, double[,] userItemMatrix, Dictionary<string, int> userIndexMap, Dictionary<int, int> destIndexMap, int topN = 5, int topK = 5)
        {
            int n, m;
            n = userItemMatrix.GetLength(0);
            m = userItemMatrix.GetLength(1);

            // 2. Napravi nonRatedDestinations
            var nonRatedDestinations = GetNonRatedDestinations(userItemMatrix, activeUserIdx, m);

            // 3. Izračunaj sličnosti i pronađi komšiluk
            var similarities = CalculateItemSimilarities(userItemMatrix, activeUserIdx);//vektor slicnosti [0.25,0.5,0.09...]
            var topNeighbors = similarities.OrderByDescending(s => s.Similarity).Take(topN).ToList();

            double activeUserAvgRating = CalculateUserAverage(userItemMatrix, activeUserIdx);
            var recommendationsVector = new Dictionary<int, double>();

            // Računanje predviđenih ocena
            foreach (var dest in nonRatedDestinations)
            {
                double brojilac = 0;
                double imenilac = 0;

                //Formula iz rada
                foreach (var neighbor in topNeighbors)
                {
                    int k = neighbor.UserIndex;
                    double sim = neighbor.Similarity;

                    if (userItemMatrix[k, dest] > 0)
                    {
                        double neighborAvg = CalculateUserAverage(userItemMatrix, k);
                        brojilac += sim * (userItemMatrix[k, dest] - neighborAvg);
                        imenilac += Math.Abs(sim);
                    }
                }

                double rez = activeUserAvgRating;
                if (imenilac > 0)
                {
                    rez = activeUserAvgRating + (brojilac / imenilac);
                }
                //Kraj formule 

                recommendationsVector[dest] = rez;
            }

            // Sortiranje i uzimanje topK preporuka
            var finalRecommendations = recommendationsVector
                .OrderByDescending(r => r.Value)
                .Take(topK)
                .ToList();

            // Mapiranje nazad na DTO objekte
            var recommendedDestIds = finalRecommendations.Select(r => destIndexMap.First(x => x.Value == r.Key).Key).ToList();
            var destinationsFromDb = await _context.Destinacije
                .Where(d => recommendedDestIds.Contains(d.Id))
                .ToListAsync();

            return recommendedDestIds
                .Select(id => destinationsFromDb.First(d => d.Id == id))
                .Select(d => new PreporukaDto
                {
                    Naziv = d.Name,
                    Description = d.Description,
                    ImageUrl = d.ImageUrl,
                    Tip = d.Type.ToString(),
                    ProsecnaOcena = d.AverageRating,
                    PredvidjenaOcena = recommendationsVector[destIndexMap[d.Id]],
                })
                .ToList();
        }
        private double CalculateAdjustedCosineSimilarity(double[,] matrix, int i1, int i2)
        {
            int n = matrix.GetLength(0);
            double dotProduct = 0, norm1 = 0, norm2 = 0;
            for (int u = 0; u < n; u++)
            {
                if (matrix[u, i1] == 0) continue;
                double userAvg = CalculateUserAverage(matrix, u);
                double val1 = matrix[u, i1] - userAvg;
                double val2 = matrix[u, i2] - userAvg;

                dotProduct += val1 * val2;
                norm1 += val1 * val1;
                norm2 += val2 * val2;
            }
            if (norm1 == 0 || norm2 == 0) return 0.0;
            return dotProduct / (Math.Sqrt(norm1) * Math.Sqrt(norm2));
        }

        #endregion
        #region Staro
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
        #endregion
    }
}
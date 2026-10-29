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
        public async Task<List<PreporukaDto>> GetRecommedationsAsync(string activeUserId, int topN = 5, int topK = 5)
        {
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

            if (!HasUserAnyRatings(userItemMatrix, activeUserIdx))
            {
                return await GetTopRatedDestinationsFallbackAsync(topK);
            }

            List<PreporukaDto> recomendations;
            if (users.Count < destIds.Count)
            {
                recomendations = await GetUserBasedRecommendationsAsync(activeUserIdx, userItemMatrix, userIndexMap, destIndexMap, topN, topK);
            }
            else
            {
                recomendations = await GetItemBasedRecommendationsAsync(activeUserIdx, userItemMatrix, userIndexMap, destIndexMap, topN, topK);
            }
            return recomendations;
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
        private List<(int ItemIndex, double Similarity)> CalculateItemSimilarities(double[,] matrix, int activeDestIdx)
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
        private bool HasUserAnyRatings(double[,] matrix, int activeUserIdx)
        {
            int m = matrix.GetLength(1);
            for (int j = 0; j < m; j++)
            {
                if (matrix[activeUserIdx, j] > 0)
                {
                    return true; // Našao je bar jednu ocenu
                }
            }
            return false; // Nema nijednu ocenu (sve su 0)
        }

        // Fallback metoda za nove korisnike (Cold Start problem)
        private async Task<List<PreporukaDto>> GetTopRatedDestinationsFallbackAsync(int topK)
        {
            var topDestinations = await _context.Destinacije
                .OrderByDescending(d => d.AverageRating)
                .Take(topK)
                .ToListAsync();

            return topDestinations
                .Select(d => new PreporukaDto
                {
                    Naziv = d.Name,
                    Description = d.Description,
                    ImageUrl = d.ImageUrl,
                    Tip = d.Type.ToString(),
                    ProsecnaOcena = d.AverageRating,
                    PredvidjenaOcena = d.AverageRating // Kod fallback-a predviđena ocena može biti sama prosečna ocena
                })
                .ToList();
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

            var recommendationsVector = new Dictionary<int, double>();

            // Računanje predviđenih ocena
            foreach (var dest in nonRatedDestinations)
            {
                double brojilac = 0;
                double imenilac = 0;
                var similarities = CalculateItemSimilarities(userItemMatrix, dest);//vektor slicnosti [0.25,0.5,0.09...]
                var topNeighbors = similarities.OrderByDescending(s => s.Similarity).Take(topN).ToList();
                //Formula iz rada
                foreach (var neighbor in topNeighbors)
                {
                    int k = neighbor.ItemIndex;
                    double sim = neighbor.Similarity;

                    if (userItemMatrix[activeUserIdx, k] > 0)
                    {
                        brojilac += sim * userItemMatrix[activeUserIdx, k];
                        imenilac += Math.Abs(sim);//da li treba ABS?
                    }
                }

                double rez = 0.0;
                if (imenilac != 0)
                {
                    rez = brojilac / imenilac;
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
                if (matrix[u, i2] == 0) continue;
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
    }
}
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly ReviewsService _reviewsService;

        public ReviewsController(ReviewsService reviewsService)
        {
            _reviewsService = reviewsService;
        }

        // GET: api/Reviews
        //vraca sve review-e
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Review>>> GetReviews()
        {
            var reviews = await _reviewsService.GetReviewsAsync();
            return Ok(reviews);
        }

        //GET: api/Reviews/5
        //vraca pojedinacni revew
        [HttpGet("{id}")]
        public async Task<ActionResult<Review>> GetReview(int id)
        {
            var review = await _reviewsService.GetReviewByIdAsync(id);

            if (review == null)
            {
                return NotFound(new { message = "Recenzija nije pronađena." });
            }

            return Ok(review);
        }

        // GET: api/Reviews/destinacija/5
        // vraca sve review za jednu dest
        [HttpGet("destinacija/{destinacijaId}")]
        public async Task<ActionResult<IEnumerable<ReviewDto>>> GetReviewsByDestinacija(int destinacijaId)
        {
            var reviews = await _reviewsService.GetReviewsByDestinacijaAsync(destinacijaId);
            return Ok(reviews);
        }

        // POST: api/Reviews
        [HttpPost]
        public async Task<ActionResult<Review>> PostReview(ReviewDto dto)
        {
            var result = await _reviewsService.CreateReviewAsync(dto);

            if (!result.Success)
            {
                if (result.IsBadRequest)
                    return BadRequest(new { message = result.ErrorMessage });

                if (result.IsNotFound)
                    return NotFound(new { message = result.ErrorMessage });
            }

            return CreatedAtAction(nameof(GetReview), new { id = result.Data!.Id }, result.Data);
        }

        //PUT: api/Reviews/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutReview(int id, [FromBody] Review review)
        {
            var result = await _reviewsService.UpdateReviewAsync(id, review);

            if (!result.Success)
            {
                if (result.IsBadRequest)
                    return BadRequest(new { message = result.ErrorMessage });

                if (result.IsNotFound)
                    return NotFound(new { message = result.ErrorMessage });
            }

            return NoContent();
        }

        //DELETE: api/Reviews/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var result = await _reviewsService.DeleteReviewAsync(id);

            if (!result.Success)
            {
                if (result.IsNotFound)
                    return NotFound(new { message = result.ErrorMessage });
            }

            return Ok(new { message = "Recenzija uspešno obrisana." });
        }

        //POST: api/Reviews/5/like
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikeReview(int id)
        {
            var result = await _reviewsService.LikeReviewAsync(id);

            if (!result.Success)
            {
                if (result.IsNotFound)
                    return NotFound(new { message = result.ErrorMessage });
            }

            return Ok(new { likeNum = result.Data });
        }

        //POST: api/Reviews/5/dislike
        [HttpPost("{id}/dislike")]
        public async Task<IActionResult> DislikeReview(int id)
        {
            var result = await _reviewsService.DislikeReviewAsync(id);

            if (!result.Success)
            {
                if (result.IsNotFound)
                    return NotFound(new { message = result.ErrorMessage });
            }

            return Ok(new { dislikeNum = result.Data });
        }
    }
}
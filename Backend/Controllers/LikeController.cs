using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LikesController : ControllerBase
    {
        private readonly LikesService _likesService;

        public LikesController(LikesService likesService)
        {
            _likesService = likesService;
        }

        // POST: api/Likes/toggle
        [HttpPost("toggle")]
        public async Task<IActionResult> ToggleReaction([FromBody] LikeDto dto)
        {
            var result = await _likesService.ToggleReactionAsync(dto);

            if (!result.Success)
            {
                if (result.IsBadRequest)
                    return BadRequest(new { message = result.ErrorMessage });

                if (result.IsNotFound)
                    return NotFound(new { message = result.ErrorMessage });
            }

            return Ok(new
            {
                message = result.Data!.Message,
                likeNum = result.Data.LikeNum,
                dislikeNum = result.Data.DislikeNum
            });
        }

        // GET: api/Likes/user-status?ReviewId=1&korisnikId=5
        [HttpGet("user-status")]
        public async Task<IActionResult> GetUserReaction([FromQuery] int ReviewId, [FromQuery] string korisnikId)
        {
            var userReaction = await _likesService.GetUserReactionAsync(ReviewId, korisnikId);

            return Ok(new { userReaction = userReaction });
        }

        // GET: api/Likes/review/5
        [HttpGet("review/{ReviewId}")]
        public async Task<IActionResult> GetReviewReactions(int ReviewId)
        {
            var result = await _likesService.GetReviewReactionsAsync(ReviewId);

            if (!result.Success)
            {
                if (result.IsNotFound)
                    return NotFound(new { message = result.ErrorMessage });
            }

            return Ok(new
            {
                ReviewId = result.Data!.ReviewId,
                likeNum = result.Data.LikeNum,
                dislikeNum = result.Data.DislikeNum
            });
        }
    }
}
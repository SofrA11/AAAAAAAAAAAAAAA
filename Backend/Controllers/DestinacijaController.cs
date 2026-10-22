using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DestinationsController : ControllerBase
    {
        private readonly DestinacijaService _destinacijaService;

        public DestinationsController(DestinacijaService destinacijaService)
        {
            _destinacijaService = destinacijaService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchDestinacije([FromQuery] PretragaDTO searchDto)
        {
            var (data, pagination) = await _destinacijaService.SearchDestinacijeAsync(searchDto);

            return Ok(new
            {
                Data = data,
                Pagination = pagination
            });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDestinations(
            [FromQuery] DestinationType? type,
            [FromQuery] string? search)
        {
            var result = await _destinacijaService.GetDestinationsAsync(type, search);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDestination(int id)
        {
            var result = await _destinacijaService.GetDestinationByIdAsync(id);

            if (result == null)
            {
                return NotFound(new { message = "Destinacija nije pronađena." });
            }

            return Ok(result);
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetDestinacije([FromQuery] int page = 1, [FromQuery] int limit = 8, [FromQuery] bool ascending = false)
        {
            var (data, pagination) = await _destinacijaService.GetPagedDestinacijeAsync(page, limit, ascending);

            return Ok(new
            {
                Data = data,
                Pagination = pagination
            });
        }

        [HttpGet("user-reviews")]
        public async Task<IActionResult> GetUserReviewedDestinations([FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { message = "Email korisnika je obavezan." });
            }

            var userReviews = await _destinacijaService.GetUserReviewedDestinationsAsync(email);
            return Ok(userReviews);
        }

        [HttpPost]

        public async Task<ActionResult<Destinacija>> PostDestination(Destinacija destinacija)
        {
            var (result, errorMessage) = await _destinacijaService.CreateDestinationAsync(destinacija);

            if (errorMessage != null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return CreatedAtAction(nameof(GetDestination), new { id = result!.Id }, result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> PutDestination(int id, Destinacija destinacija)
        {
            if (id != destinacija.Id)
            {
                return BadRequest(new { message = "ID u ruti i u telu zahteva se ne poklapaju." });
            }

            var (success, errorMessage, notFound) = await _destinacijaService.UpdateDestinationAsync(id, destinacija);

            if (notFound)
            {
                return NotFound(new { message = "Destinacija nije pronađena." });
            }

            if (!success && errorMessage != null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteDestination(int id)
        {
            var success = await _destinacijaService.DeleteDestinationAsync(id);

            if (!success)
            {
                return NotFound(new { message = "Destinacija nije pronađena." });
            }

            return Ok(new { message = "Destinacija je uspešno obrisana." });
        }
    }
}
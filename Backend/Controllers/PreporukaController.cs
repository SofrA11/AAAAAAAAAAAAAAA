using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PreporukaController : ControllerBase
    {
        private readonly PreporukaService _preporukaService;

        public PreporukaController(PreporukaService preporukaService)
        {
            _preporukaService = preporukaService;
        }
        [HttpGet]
        public async Task<IActionResult> GetPreporuke([FromQuery] int limit = 5)
        {
            //citanje ID-ja iz JWT tokena ulogovanog korisnika
            var korisnikId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? User.FindFirst("id")?.Value
                          ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(korisnikId))
            {
                return Unauthorized("Nije moguće identifikovati ulogovanog korisnika iz tokena.");
            }

            var preporuke = await _preporukaService.GetRecommedationsAsync(korisnikId, limit);
            return Ok(preporuke);
        }

    }
}
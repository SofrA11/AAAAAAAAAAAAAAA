using System.Security.Claims;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AutentifikacijaController : ControllerBase
    {
        private readonly AutentifikacijaService _authService;

        public AutentifikacijaController(
            AutentifikacijaService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(
            [FromBody] RegistracijaDTO dto)
        {
            var result = await _authService.Register(dto);

            if (!result.Success)
                return BadRequest(result.Error);

            return Ok(result.Data);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] PrijavljivanjeDTO dto)
        {
            var result = await _authService.Login(dto);

            if (!result.Success)
                return Unauthorized(result.Error);

            return Ok(result.Data);
        }

        [HttpGet("profil")]
        [Authorize]
        public async Task<IActionResult> GetProfil()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            var result = await _authService.GetProfil(userId);

            if (!result.Success)
                return NotFound(result.Error);

            return Ok(result.Data);
        }

        [HttpPut("azuriraj-profil")]
        [Authorize]
        public async Task<IActionResult> AzurirajProfil(
            [FromBody] AzurirajProfilDTO dto)
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            var result = await _authService.AzurirajProfil(
                userId,
                dto
            );

            if (!result.Success)
                return BadRequest(result.Error);

            return Ok(result.Data);
        }
    }
}

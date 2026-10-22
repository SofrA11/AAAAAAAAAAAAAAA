using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GradoviController : ControllerBase
    {
        private readonly GradService _gradService;

        public GradoviController(GradService gradService)
        {
            _gradService = gradService;
        }

        // GET: api/Gradovi
        // vraca sve gradove unutar jedne dryave
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetGradoviByDrzavaID([FromQuery] int? drzavaId)
        {
            var gradovi = await _gradService.GetGradoviByDrzavaIdAsync(drzavaId);
            return Ok(gradovi);
        }

        [HttpGet("filter")]
        public async Task<ActionResult<IEnumerable<object>>> GetGradovi(
            [FromQuery] int? drzavaId,
            [FromQuery] string? search = null,
            [FromQuery] int limit = 50)
        {
            var gradovi = await _gradService.GetGradoviFilteredAsync(drzavaId, search, limit);
            return Ok(gradovi);
        }

        //vraca grad i podatke o drzavi
        [HttpGet("{id}")]
        public async Task<IActionResult> GetGrad(int id)
        {
            var grad = await _gradService.GetGradByIdAsync(id);

            if (grad == null)
            {
                return NotFound(new { message = "Grad nije pronađen." });
            }

            return Ok(grad);
        }

        //kreira grad
        [HttpPost]
        public async Task<ActionResult<Grad>> PostGrad(Grad grad)
        {
            var (result, errorMessage) = await _gradService.CreateGradAsync(grad);

            if (errorMessage != null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return CreatedAtAction(nameof(GetGrad), new { id = result!.Id }, result);
        }

        //azurira grad
        [HttpPut("{id}")]
        public async Task<IActionResult> PutGrad(int id, Grad grad)
        {
            if (id != grad.Id)
            {
                return BadRequest(new { message = "ID u ruti i u telu zahteva se ne poklapaju." });
            }

            var (success, errorMessage, isNotFound) = await _gradService.UpdateGradAsync(id, grad);

            if (isNotFound)
            {
                return NotFound(new { message = "Grad nije pronađen." });
            }

            if (!success && errorMessage != null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return NoContent();
        }

        // brise grad
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGrad(int id)
        {
            var deleted = await _gradService.DeleteGradAsync(id);

            if (!deleted)
            {
                return NotFound(new { message = "Grad nije pronađen." });
            }

            return Ok(new { message = "Grad je uspesno obrisan." });
        }
    }
}
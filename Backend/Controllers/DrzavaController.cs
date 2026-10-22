using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DrzaveController : ControllerBase
    {
        private readonly DrzavaService _drzavaService;

        public DrzaveController(DrzavaService drzavaService)
        {
            _drzavaService = drzavaService;
        }

        //Vraca nazive svih drzava u bazi
        [HttpGet("Nazivi")]
        public async Task<ActionResult<IEnumerable<object>>> GetNaziviDrzava()
        {
            var drzave = await _drzavaService.GetNaziviDrzavaAsync();
            return Ok(drzave);
        }


        // Vraca sve drzave sa njihovim gradovima
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDrzave()
        {
            var drzave = await _drzavaService.GetDrzaveAsync();
            return Ok(drzave);
        }


        //Vraca info o drzavi prema ID drzave
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDrzava(int id)
        {
            var drzava = await _drzavaService.GetDrzavaByIdAsync(id);

            if (drzava == null)
            {
                return NotFound(new { message = "Država nije pronađena." });
            }

            return Ok(drzava);
        }

        //Dodavanje drzave u bazu
        [HttpPost]
        public async Task<ActionResult<Drzava>> PostDrzava(Drzava drzava)
        {
            var (result, errorMessage) = await _drzavaService.CreateDrzavaAsync(drzava);

            if (errorMessage != null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return CreatedAtAction(nameof(GetDrzava), new { id = result!.Id }, result);
        }
        //Azurianje drzave
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDrzava(int id, Drzava drzava)
        {
            if (id != drzava.Id)
            {
                return BadRequest(new { message = "ID u ruti i u telu zahteva se ne poklapaju." });
            }

            var updated = await _drzavaService.UpdateDrzavaAsync(id, drzava);

            if (!updated)
            {
                return NotFound(new { message = "Država nije pronađena." });
            }

            return NoContent();
        }

        // Brisanje drzave
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDrzava(int id)
        {
            var deleted = await _drzavaService.DeleteDrzavaAsync(id);

            if (!deleted)
            {
                return NotFound(new { message = "Država nije pronađena." });
            }

            return Ok(new { message = "Država je uspešno obrisana." });
        }
    }
}
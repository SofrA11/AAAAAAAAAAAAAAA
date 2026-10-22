using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KorisnikController : ControllerBase
    {
        private readonly UserManager<Korisnik> _userManager;
        private readonly IConfiguration _configuration;

        public KorisnikController(UserManager<Korisnik> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

    }
}
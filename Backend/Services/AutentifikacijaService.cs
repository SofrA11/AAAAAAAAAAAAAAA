using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services
{
    public class AutentifikacijaService
    {
        private readonly UserManager<Korisnik> _userManager;
        private readonly IConfiguration _configuration;

        public AutentifikacijaService(
            UserManager<Korisnik> userManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        public async Task<(bool Success, string? Error, object? Data)> Register(
            RegistracijaDTO dto)
        {
            var userExists = await _userManager.FindByEmailAsync(dto.Email);

            if (userExists != null)
            {
                return (
                    false,
                    "Korisnik sa ovim email-om već postoji.",
                    null
                );
            }

            var user = new Korisnik
            {
                Email = dto.Email,
                UserName = dto.KorisnickoIme,
                NormalizedEmail = dto.Email.ToUpperInvariant(),
                NormalizedUserName = dto.KorisnickoIme.ToUpperInvariant(),
                Ime = dto.Ime,
                Prezime = dto.Prezime,
                GodinaRodjenja = dto.GodinaRodjenja
            };

            var result = await _userManager.CreateAsync(user, dto.Lozinka);

            if (!result.Succeeded)
            {
                return (
                    false,
                    string.Join(", ", result.Errors.Select(e => e.Description)),
                    null
                );
            }
            await _userManager.AddToRoleAsync(user, "Turista");
            return (
                true,
                null,
                new { message = "Registracija uspešna!" }
            );
        }

        public async Task<(bool Success, string? Error, object? Data)> Login(
            PrijavljivanjeDTO dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);

            if (user == null ||
                !await _userManager.CheckPasswordAsync(user, dto.Lozinka))
            {
                return (
                    false,
                    "Pogrešan email ili lozinka.",
                    null
                );
            }

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim("Ime", user.Ime)
            };

            var userRoles = await _userManager.GetRolesAsync(user);
            var userRole = userRoles.FirstOrDefault();

            if (!string.IsNullOrEmpty(userRole))
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }

            var secret = _configuration["Jwt:Secret"];

            if (string.IsNullOrEmpty(secret))
            {
                throw new InvalidOperationException("Jwt:Secret nije konfigurisan.");
            }

            var authSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(secret)
            );
            var token = new JwtSecurityToken(
                expires: DateTime.UtcNow.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(
                    authSigningKey,
                    SecurityAlgorithms.HmacSha256
                )
            );

            var tokenString =
                new JwtSecurityTokenHandler().WriteToken(token);

            return (
                true,
                null,
                new
                {
                    token = tokenString,
                    expiration = token.ValidTo,
                    user = new
                    {
                        user.Ime,
                        user.Email,
                        userRole
                    }
                }
            );
        }

        public async Task<(bool Success, string? Error, object? Data)> GetProfil(
            string? userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return (
                    false,
                    "Korisnik nije pronađen.",
                    null
                );
            }

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return (
                    false,
                    "Korisnik nije pronađen.",
                    null
                );
            }

            return (
                true,
                null,
                new
                {
                    Ime = user.Ime,
                    Prezime = user.Prezime,
                    GodinaRodjenja = user.GodinaRodjenja,
                    Username = user.UserName,
                    Email = user.Email
                }
            );
        }

        public async Task<(bool Success, string? Error, object? Data)> AzurirajProfil(
            string? userId,
            AzurirajProfilDTO dto)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return (
                    false,
                    "Korisnik nije pronađen.",
                    null
                );
            }

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return (
                    false,
                    "Korisnik nije pronađen.",
                    null
                );
            }

            // Promena lozinke
            if (!string.IsNullOrWhiteSpace(dto.NovaLozinka))
            {
                if (string.IsNullOrWhiteSpace(dto.StaraLozinka))
                {
                    return (
                        false,
                        "Morate uneti trenutnu lozinku da biste postavili novu.",
                        null
                    );
                }

                var changePasswordResult =
                    await _userManager.ChangePasswordAsync(
                        user,
                        dto.StaraLozinka,
                        dto.NovaLozinka
                    );

                if (!changePasswordResult.Succeeded)
                {
                    return (
                        false,
                        string.Join(
                            ", ",
                            changePasswordResult.Errors
                                .Select(e => e.Description)
                        ),
                        null
                    );
                }
            }

            // azuriranje ostalih podataka
            user.Ime = dto.Ime;
            user.Prezime = dto.Prezime;
            user.GodinaRodjenja = dto.GodinaRodjenja;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return (
                    false,
                    string.Join(
                        ", ",
                        result.Errors.Select(e => e.Description)
                    ),
                    null
                );
            }

            return (
                true,
                null,
                new { message = "Profil je uspešno ažuriran." }
            );
        }
    }
}


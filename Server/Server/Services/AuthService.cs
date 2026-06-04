using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Common;
using Server.Data;
using Server.DTOs.Auth;
using Server.Models.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email)) return ServiceResult<AuthResponseDto>.Fail("Email already exists.");

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            var token = GenerateToken(user);
            var refreshToken = GenerateRefreshToken();
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(int.TryParse(_config["Jwt:RefreshTokenExpiresInDays"], out int days) ? days : 7);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return ServiceResult<AuthResponseDto>.Ok(new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                Name = user.Name,
                Email = user.Email,
                UserId = user.Id
            });
        }

        public async Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null) { return ServiceResult<AuthResponseDto>.Fail("User not found"); } 
            if(!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)) return ServiceResult<AuthResponseDto>.Fail("Wrong Password.");

            var token = GenerateToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(int.TryParse(_config["Jwt:RefreshTokenExpiresInDays"], out int days) ? days : 7);

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return ServiceResult<AuthResponseDto>.Ok(new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                Name = user.Name,
                Email = user.Email,
                UserId = user.Id
            });
        }

        public async Task<ServiceResult<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto dto)
        {
            try 
            { 
                var principle = GetPrincipleFromExpiredToken(dto.Token);
                if (principle == null) return ServiceResult<AuthResponseDto>.Fail("User not found");
                var emailClaim = principle.FindFirst(ClaimTypes.Email);
                if (emailClaim == null) return ServiceResult<AuthResponseDto>.Fail("User not found");
                var user = _context.Users.FirstOrDefault(u => u.Email == emailClaim.Value);
                if (user == null 
                    || user.RefreshToken != dto.RefreshToken 
                    || user.RefreshTokenExpiryTime <= DateTime.UtcNow) 
                    return ServiceResult<AuthResponseDto>.Fail("Invalid refresh token");

                var newAccessToken = GenerateToken(user);
                var newRefreshToken = GenerateRefreshToken();

                user.RefreshToken = newRefreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(int.TryParse(_config["Jwt:RefreshTokenExpiresInDays"], out int days)? days : 7);

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return ServiceResult<AuthResponseDto>.Ok(new AuthResponseDto
                {
                    Token = newAccessToken,
                    RefreshToken = newRefreshToken,
                    Name = user.Name,
                    Email = user.Email,
                    UserId = user.Id
                });
            }
            catch
            {
                return ServiceResult<AuthResponseDto>.Fail("Internal server error. Please try again.");
            }
         }

        private string GenerateToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(int.TryParse(_config["Jwt:AccessTokenExpiresInMinutes"], out int minutes) ? minutes : 15),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNymber = new byte[64];

            using var rng = RandomNumberGenerator.Create();

            rng.GetBytes(randomNymber);
            return Convert.ToBase64String(randomNymber);
        }

        private ClaimsPrincipal? GetPrincipleFromExpiredToken(string? token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidAudience = _config["Jwt:Audience"],
                ValidateIssuer = true,
                ValidIssuer = _config["Jwt:Issuer"],
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)),
                ValidateLifetime = false
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principle = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            if(securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                throw new SecurityTokenException("Invalid token");
            }
            return principle;
        }
        
    }

}
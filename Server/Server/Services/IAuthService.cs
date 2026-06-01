using Server.DTOs.Auth;

namespace Server.Services
{
        public interface IAuthService
        {
            Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
            Task<AuthResponseDto?> LoginAsync(LoginDto dto);
        }
    
}

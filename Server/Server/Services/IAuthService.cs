using Server.Common;
using Server.DTOs.Auth;

namespace Server.Services
{
        public interface IAuthService
        {
            Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterDto dto);
            Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginDto dto);
            Task<ServiceResult<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto dto);
        }
    
}

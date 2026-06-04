using Server.Common;

namespace Server.Services
{
    public interface IImageService
    {
        Task<ServiceResult<string>> UploadImageAsync(IFormFile file, string folder);
        Task DeleteImageAsync(string imageUrl);
    }
}

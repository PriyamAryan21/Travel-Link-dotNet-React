
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace Server.Services
{
    public class ImageService : IImageService
    {
        private readonly Cloudinary _cloudinary;
        public ImageService(Cloudinary cloudinary)
        {
            _cloudinary = cloudinary;
        }
        public async Task DeleteImageAsync(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl)) return;

            var uri = new Uri(imageUrl);
            var segments = uri.AbsolutePath.Split('/');
            var uploadIndex = Array.IndexOf(segments, "upload");
            var startingIndex = uploadIndex + 1;

            if (
                startingIndex < segments.Length 
             && segments[startingIndex].StartsWith("v") 
             && long.TryParse(segments[startingIndex][1..], out _)
                )
                {
                    startingIndex++;
                }
            var publicId = string.Join("/", segments[startingIndex..]);
            publicId = Path.ChangeExtension(publicId, null);

            var deleteParams = new DeletionParams(publicId);
            await _cloudinary.DestroyAsync(deleteParams);
        }

        public async Task<string> UploadImageAsync(IFormFile file, string folder)
        {
            await using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = folder,
                Transformation = new Transformation().Width(400).Height(400).Crop("fill").Gravity("face")
            };
            var result = await _cloudinary.UploadAsync(uploadParams);
            return result.SecureUrl.ToString();
        }

    }
}

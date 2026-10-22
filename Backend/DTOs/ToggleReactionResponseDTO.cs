
namespace Backend.DTOs
{
    public class ToggleReactionResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public int LikeNum { get; set; }
        public int DislikeNum { get; set; }
    }
}
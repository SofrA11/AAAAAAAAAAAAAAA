namespace Backend.DTOs
{
    public class LikeDto
    {
        public string Email { get; set; } = string.Empty;
        public int ReviewId { get; set; }
        public bool Liked { get; set; }
    }
}
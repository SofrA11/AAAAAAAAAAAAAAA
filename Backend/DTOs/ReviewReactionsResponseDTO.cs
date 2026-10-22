namespace Backend.DTOs
{
    public class ReviewReactionsResponseDto
    {
        public int ReviewId { get; set; }
        public int LikeNum { get; set; }
        public int DislikeNum { get; set; }
    }
}
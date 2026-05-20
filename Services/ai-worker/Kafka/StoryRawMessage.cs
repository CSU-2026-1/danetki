namespace Danetka.AiWorker.Kafka;

// DTO для сообщения в топике stories.raw.
// Контракт: contracts/story.raw.json
public class StoryRawMessage
{
    public Guid StoryId { get; set; }
    public Guid JobId { get; set; }
    public string Text { get; set; } = "";
    public string SourceUrl { get; set; } = "";
    public string? SourceTitle { get; set; }
    public DateTime ParsedAt { get; set; }
    public int RetryCount { get; set; }
}

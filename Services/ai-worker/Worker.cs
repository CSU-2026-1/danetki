using System.Text.Json;
using Confluent.Kafka;
using Danetka.AiWorker.Kafka;

namespace Danetka.AiWorker;

public class Worker : BackgroundService
{
    // Один общий объект настроек на весь жизненный цикл воркера.
    // SnakeCaseLower маппит story_id -> StoryId, parsed_at -> ParsedAt и т.д.
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    private readonly ILogger<Worker> _logger;
    private readonly IConfiguration _config;

    public Worker(ILogger<Worker> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var bootstrap = _config["KAFKA_BOOTSTRAP_SERVERS"] ?? "localhost:9092";
        var group     = _config["KAFKA_CONSUMER_GROUP"]    ?? "ai-worker-group";
        var topic     = _config["KAFKA_TOPIC_INPUT"]       ?? "stories.raw";

        var consumerConfig = new ConsumerConfig
        {
            BootstrapServers = bootstrap,
            GroupId          = group,
            AutoOffsetReset  = AutoOffsetReset.Earliest,
            EnableAutoCommit = true,
        };

        using var consumer = new ConsumerBuilder<string, string>(consumerConfig)
            .SetErrorHandler((_, e) => _logger.LogWarning("Kafka error: {Reason}", e.Reason))
            .Build();

        consumer.Subscribe(topic);
        _logger.LogInformation(
            "Subscribed: topic={Topic} bootstrap={Bootstrap} group={Group}",
            topic, bootstrap, group);

        await Task.Yield();

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = consumer.Consume(stoppingToken);
                    if (result?.Message is null) continue;

                    HandleMessage(result);
                }
                catch (ConsumeException ex)
                {
                    // Инфраструктурная ошибка Kafka (рестарт брокера, недоступность).
                    _logger.LogWarning("Consume error: {Reason}", ex.Error.Reason);
                    await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Нормальное завершение по SIGTERM / Ctrl+C
        }
        finally
        {
            consumer.Close();
        }
    }

    private void HandleMessage(ConsumeResult<string, string> result)
    {
        try
        {
            // На Windows PowerShell-пайпы добавляют UTF-8 BOM (U+FEFF).
            // В реальном flow от Python parser'а BOM не будет, но защищаемся.
            var raw = result.Message.Value.TrimStart('﻿');

            var msg = JsonSerializer.Deserialize<StoryRawMessage>(raw, JsonOpts);
            if (msg is null)
            {
                _logger.LogWarning(
                    "Deserialized to null at offset={Offset}",
                    result.Offset.Value);
                return;
            }

            _logger.LogInformation(
                "Received story: id={StoryId} job={JobId} url={SourceUrl} textLen={TextLen} retry={Retry}",
                msg.StoryId, msg.JobId, msg.SourceUrl, msg.Text.Length, msg.RetryCount);
        }
        catch (JsonException ex)
        {
            // Невалидный JSON — логируем и идём дальше (не падаем).
            // В будущем такие сообщения будут уходить в DLQ.
            _logger.LogWarning(
                "Bad JSON at offset={Offset}: {Reason}",
                result.Offset.Value, ex.Message);
        }
    }
}

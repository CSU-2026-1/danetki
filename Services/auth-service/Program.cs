using System.IdentityModel.Tokens.Jwt;
using Danetka.AuthService.Data;
using Danetka.AuthService.Models;
using Danetka.AuthService.Services;
using Microsoft.EntityFrameworkCore;

JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["Jwt:Secret"] = builder.Configuration["JWT_SECRET"],
    ["Jwt:Issuer"] = builder.Configuration["JWT_ISSUER"],
    ["Jwt:Audience"] = builder.Configuration["JWT_AUDIENCE"],
    ["Jwt:ExpirationHours"] = builder.Configuration["JWT_EXPIRATION_HOURS"] ?? "1"
});

builder.Services.AddGrpc();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var dbHost = builder.Configuration["DB_HOST"];
if (!string.IsNullOrEmpty(dbHost))
{
    var dbName = builder.Configuration["DB_NAME"];
    var dbPort = builder.Configuration["DB_PORT"];
    var dbUser = builder.Configuration["DB_USER"];
    var dbPassword =  builder.Configuration["DB_PASSWORD"];
    
    connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";
}

builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(connectionString));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    db.Database.Migrate();
    
    if (!db.Roles.Any())
    {
        db.Roles.AddRange(
            new Role { Id = Guid.NewGuid(), Name = "user" }, 
            new Role { Id = Guid.NewGuid(), Name = "admin" }
            );
        db.SaveChanges();
    }
}

app.MapGrpcService<AuthGrpcService>();
app.MapGet("/", () => "Service alive. Communication with gRPC endpoints must be made through a gRPC client.");

app.Run();
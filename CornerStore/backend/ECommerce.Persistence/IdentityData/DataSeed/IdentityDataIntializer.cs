using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.IdentityModule;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ECommerce.Persistence.IdentityData.DataSeed;

public class IdentityDataIntializer : IDataIntializer
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IdentityDataIntializer> _logger;

    public IdentityDataIntializer(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ILogger<IdentityDataIntializer> logger
    )
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task IntializeAsync()
    {
        try
        {
            if (!_roleManager.Roles.Any())
            {
                await _roleManager.CreateAsync(new IdentityRole("Admin"));
                await _roleManager.CreateAsync(new IdentityRole("SuperAdmin"));
            }

            if (_userManager.Users.Any())
                return;

            var email = _configuration["BootstrapAdmin:Email"]?.Trim();
            var password = _configuration["BootstrapAdmin:Password"];
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                _logger.LogInformation(
                    "No identity users exist. Set BootstrapAdmin__Email and BootstrapAdmin__Password to create the first admin."
                );
                return;
            }

            var displayName =
                _configuration["BootstrapAdmin:DisplayName"]?.Trim() ?? "Corner Store Admin";
            var role = _configuration["BootstrapAdmin:Role"]?.Trim() ?? "SuperAdmin";
            if (role is not "Admin" and not "SuperAdmin")
                role = "SuperAdmin";

            var userName = email.Contains('@', StringComparison.Ordinal)
                ? email.Split('@')[0]
                : email;

            var user = new ApplicationUser
            {
                DisplayName = displayName,
                UserName = userName,
                Email = email,
                EmailConfirmed = true,
            };

            var createResult = await _userManager.CreateAsync(user, password);
            if (!createResult.Succeeded)
            {
                _logger.LogWarning(
                    "Bootstrap admin was not created: {Errors}",
                    string.Join(", ", createResult.Errors.Select(e => e.Description))
                );
                return;
            }

            await _userManager.AddToRoleAsync(user, role);
            _logger.LogInformation("Bootstrap admin account created for {Email} with role {Role}.", email, role);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while seeding identity database.");
        }
    }
}

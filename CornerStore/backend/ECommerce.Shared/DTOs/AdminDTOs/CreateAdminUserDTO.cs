using System.ComponentModel.DataAnnotations;

namespace ECommerce.Shared.DTOs.AdminDTOs;

public class CreateAdminUserDTO
{
    [Required, EmailAddress]
    public string Email { get; set; } = default!;

    [Required, MaxLength(100)]
    public string DisplayName { get; set; } = default!;

    [MaxLength(100)]
    public string? UserName { get; set; }

    [Required, MinLength(6)]
    public string Password { get; set; } = default!;

    [Phone]
    public string? PhoneNumber { get; set; }

    public List<string> Roles { get; set; } = new();
}

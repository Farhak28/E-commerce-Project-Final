using System.ComponentModel.DataAnnotations;

namespace ECommerce.Shared.DTOs.AdminDTOs;

public class UpdateAdminUserDTO
{
    [Required, MaxLength(100)]
    public string DisplayName { get; set; } = default!;

    [Phone]
    public string? PhoneNumber { get; set; }

    public List<string> Roles { get; set; } = new();

    [MinLength(6)]
    public string? Password { get; set; }
}

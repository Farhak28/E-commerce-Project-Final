namespace ECommerce.Shared.DTOs.AdminDTOs;

public record AdminUserDTO(
    string Id,
    string Email,
    string DisplayName,
    string? PhoneNumber,
    List<string> Roles,
    int OrdersCount
);

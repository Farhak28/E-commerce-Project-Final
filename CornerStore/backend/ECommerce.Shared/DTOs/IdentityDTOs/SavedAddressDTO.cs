namespace ECommerce.Shared.DTOs.IdentityDTOs;

public record SavedAddressDTO(
    int Id,
    string Name,
    string FirstName,
    string LastName,
    string City,
    string Street,
    string Country
);

using System.ComponentModel.DataAnnotations;

namespace ECommerce.Shared.DTOs.IdentityDTOs;

public class UpsertSavedAddressDTO
{
    public int? Id { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = default!;

    [Required, MaxLength(50)]
    public string FirstName { get; set; } = default!;

    [Required, MaxLength(50)]
    public string LastName { get; set; } = default!;

    [Required, MaxLength(50)]
    public string City { get; set; } = default!;

    [Required, MaxLength(100)]
    public string Street { get; set; } = default!;

    [Required, MaxLength(50)]
    public string Country { get; set; } = default!;
}

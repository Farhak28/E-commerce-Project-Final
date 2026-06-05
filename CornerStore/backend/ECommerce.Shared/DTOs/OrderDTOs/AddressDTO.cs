namespace ECommerce.Shared.DTOs.OrderDTOs
{
    public record AddressDTO
    {
        public required string FirstName { get; init; }
        public required string LastName { get; init; }

        public required string City { get; init; }

        public required string Street { get; init; }

        public required string Country { get; init; }
    }
}

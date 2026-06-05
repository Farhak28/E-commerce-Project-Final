using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.IdentityDTOs;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services.Abstraction
{
    public interface IAuthenticationService
    {
        Task<Result<UserDTO>> LoginAsync(LoginDTO loginDTO);

        Task<Result<UserDTO>> RegisterAsync(RegisterDTO registerDTO);

        Task<bool> CheckEmailAsync(string email);

        Task<Result<UserDTO>> GetUserByEmailAsync(string email);

        Task<Result<AddressDTO>> GetAddressAsync(string email);

        Task<Result<AddressDTO>> UpdateUserAddressAsync(string email, AddressDTO addressDTO);

        Task<Result<IReadOnlyList<SavedAddressDTO>>> GetAddressesAsync(string email);

        Task<Result<SavedAddressDTO>> UpsertSavedAddressAsync(
            string email,
            UpsertSavedAddressDTO addressDTO
        );

        Task<Result> DeleteSavedAddressAsync(string email, int addressId);
    }
}

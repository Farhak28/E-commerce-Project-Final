using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ECommerce.Shared.DTOs.IdentityDTOs;

namespace ECommerce.Shared.DTOs.IdentityDTOs
{
    public record RegisterDTO(
        [EmailAddress] string Email,
        string DisplayName,
        string UserName,
        string Password,
        [Phone] string PhoneNumber,
        List<UpsertSavedAddressDTO>? Addresses = null
    );
}

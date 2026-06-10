using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Domain.Entities.IdentityModule;
using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.IdentityDTOs;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.OrderDTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ECommerce.Services
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;

        public AuthenticationService(
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            IMapper mapper
        )
        {
            _userManager = userManager;
            _configuration = configuration;
            _mapper = mapper;
        }

        public async Task<bool> CheckEmailAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);

            return user != null;
        }

        public async Task<Result<AddressDTO>> GetAddressAsync(string email)
        {
            var user = await FindUserWithAddressesAsync(email);
            if (user is null)
                return Error.NotFound("User.NotFound", $"User with this email:{email} was not found.");

            var address = GetPreferredAddress(user);
            if (address is null)
                return Error.NotFound("Address.NotFound", "No saved address found for this user.");

            return ToAddressDto(address);
        }

        public async Task<Result<IReadOnlyList<SavedAddressDTO>>> GetAddressesAsync(string email)
        {
            var user = await FindUserWithAddressesAsync(email);
            if (user is null)
                return Error.NotFound("User.NotFound", $"User with this email:{email} was not found.");

            var addresses = user.Addresses
                .OrderBy(a => a.Name)
                .ThenBy(a => a.Id)
                .Select(a => _mapper.Map<SavedAddressDTO>(a))
                .ToList();

            return addresses;
        }

        public async Task<Result<SavedAddressDTO>> UpsertSavedAddressAsync(
            string email,
            UpsertSavedAddressDTO addressDTO
        )
        {
            var name = addressDTO.Name?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(name))
                return Error.Validation("Address.InvalidName", "Address name is required.");

            var user = await FindUserWithAddressesAsync(email);
            if (user is null)
                return Error.NotFound("User.NotFound", $"User with this email:{email} was not found.");

            Address saved;
            if (addressDTO.Id is int addressId)
            {
                var existing = user.Addresses.FirstOrDefault(a => a.Id == addressId);
                if (existing is null)
                    return Error.NotFound("Address.NotFound", "Address not found.");

                existing.Name = name;
                existing.FirstName = addressDTO.FirstName.Trim();
                existing.LastName = addressDTO.LastName.Trim();
                existing.City = addressDTO.City.Trim();
                existing.Street = addressDTO.Street.Trim();
                existing.Country = addressDTO.Country.Trim();
                saved = existing;
            }
            else
            {
                saved = new Address
                {
                    Name = name,
                    FirstName = addressDTO.FirstName.Trim(),
                    LastName = addressDTO.LastName.Trim(),
                    City = addressDTO.City.Trim(),
                    Street = addressDTO.Street.Trim(),
                    Country = addressDTO.Country.Trim(),
                    UserId = user.Id,
                };
                user.Addresses.Add(saved);
            }

            await _userManager.UpdateAsync(user);

            return _mapper.Map<SavedAddressDTO>(saved);
        }

        public async Task<Result> DeleteSavedAddressAsync(string email, int addressId)
        {
            var user = await FindUserWithAddressesAsync(email);
            if (user is null)
                return Result.Fail(Error.NotFound("User.NotFound", $"User with this email:{email} was not found."));

            var existing = user.Addresses.FirstOrDefault(a => a.Id == addressId);
            if (existing is null)
                return Result.Fail(Error.NotFound("Address.NotFound", "Address not found."));

            user.Addresses.Remove(existing);
            await _userManager.UpdateAsync(user);

            return Result.Ok();
        }

        public async Task<Result<UserDTO>> GetUserByEmailAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user is null)
                return Error.NotFound("User.NotFound", $"User with this email:{email} was not found.");

            var roles = await _userManager.GetRolesAsync(user);
            return new UserDTO(user.Email!, user.DisplayName, await CreateTokenAsync(user), roles);
        }

        public async Task<Result<UserDTO>> LoginAsync(LoginDTO loginDTO)
        {
            var user = await _userManager.FindByEmailAsync(loginDTO.Email);

            if (user is null)
                return Error.InvalidCredintals("User.InvalidCredintals");

            var IsPasswordValid = await _userManager.CheckPasswordAsync(user, loginDTO.Password);
            if (!IsPasswordValid)
                return Error.InvalidCredintals("User.InvalidCredintals");

            var token = await CreateTokenAsync(user);
            var roles = await _userManager.GetRolesAsync(user);
            return new UserDTO(user.Email!, user.DisplayName, token, roles);
        }

        public async Task<Result<UserDTO>> RegisterAsync(RegisterDTO registerDTO)
        {
            var email = registerDTO.Email.Trim();
            var userName = string.IsNullOrWhiteSpace(registerDTO.UserName)
                ? BuildUserNameFromEmail(email)
                : registerDTO.UserName.Trim();

            var user = new ApplicationUser()
            {
                Email = email,
                DisplayName = registerDTO.DisplayName.Trim(),
                PhoneNumber = registerDTO.PhoneNumber,
                UserName = userName,
            };

            var identityResult = await _userManager.CreateAsync(user, registerDTO.Password);

            if (!identityResult.Succeeded)
            {
                return identityResult
                    .Errors.Select(E => Error.Validation(E.Code, E.Description))
                    .ToList();
            }

            if (registerDTO.Addresses?.Count > 0)
            {
                foreach (var address in registerDTO.Addresses.Where(IsPopulatedAddress))
                {
                    await UpsertSavedAddressAsync(email, address);
                }
            }

            var token = await CreateTokenAsync(user);
            var roles = await _userManager.GetRolesAsync(user);
            return new UserDTO(user.Email!, user.DisplayName, token, roles);
        }

        public async Task<Result<AddressDTO>> UpdateUserAddressAsync(
            string email,
            AddressDTO addressDTO
        )
        {
            var upsert = new UpsertSavedAddressDTO
            {
                Name = "Home",
                FirstName = addressDTO.FirstName,
                LastName = addressDTO.LastName,
                City = addressDTO.City,
                Street = addressDTO.Street,
                Country = addressDTO.Country,
            };

            var user = await FindUserWithAddressesAsync(email);
            if (user is not null)
            {
                var home = user.Addresses.FirstOrDefault(a =>
                    string.Equals(a.Name, "Home", StringComparison.OrdinalIgnoreCase));
                if (home is not null)
                    upsert.Id = home.Id;
            }

            var result = await UpsertSavedAddressAsync(email, upsert);
            if (!result.IsSuccess)
                return Result<AddressDTO>.Fail(result.Errors.ToList());

            var saved = result.Value;
            return new AddressDTO
            {
                FirstName = saved.FirstName,
                LastName = saved.LastName,
                City = saved.City,
                Street = saved.Street,
                Country = saved.Country,
            };
        }

        private async Task<ApplicationUser?> FindUserWithAddressesAsync(string email)
        {
            return await _userManager
                .Users.Include(u => u.Addresses)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        private static Address? GetPreferredAddress(ApplicationUser user) =>
            user.Addresses.FirstOrDefault(a =>
                string.Equals(a.Name, "Home", StringComparison.OrdinalIgnoreCase))
            ?? user.Addresses.OrderBy(a => a.Id).FirstOrDefault();

        private static AddressDTO ToAddressDto(Address address) =>
            new()
            {
                FirstName = address.FirstName,
                LastName = address.LastName,
                City = address.City,
                Street = address.Street,
                Country = address.Country,
            };

        private static bool IsPopulatedAddress(UpsertSavedAddressDTO address) =>
            !string.IsNullOrWhiteSpace(address.Name)
            && !string.IsNullOrWhiteSpace(address.FirstName)
            && !string.IsNullOrWhiteSpace(address.LastName)
            && !string.IsNullOrWhiteSpace(address.City)
            && !string.IsNullOrWhiteSpace(address.Street)
            && !string.IsNullOrWhiteSpace(address.Country);

        private static string BuildUserNameFromEmail(string email)
        {
            var normalized = email.Trim().ToLowerInvariant();
            var parts = normalized.Split('@', 2);
            var local = new string(parts[0].Where(char.IsLetterOrDigit).ToArray());
            var domain = parts.Length > 1
                ? new string(parts[1].Where(char.IsLetterOrDigit).ToArray())
                : "user";
            if (string.IsNullOrEmpty(local))
                local = "user";
            if (string.IsNullOrEmpty(domain))
                domain = "user";
            var combined = $"{local}_{domain}";
            return combined.Length > 256 ? combined[..256] : combined;
        }

        private async Task<string> CreateTokenAsync(ApplicationUser user)
        {
            var claims = new List<Claim>()
            {
                new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                new Claim(JwtRegisteredClaimNames.Name, user.UserName!),
                new Claim("display_name", user.DisplayName ?? user.Email!),
            };

            var roles = await _userManager.GetRolesAsync(user);

            foreach (var role in roles)
                claims.Add(new Claim(ClaimTypes.Role, role));

            var secretKey = _configuration["JWTOptions:SecretKey"]!;
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var cred = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["JWTOptions:Issuer"],
                audience: _configuration["JWTOptions:Audience"],
                expires: DateTime.UtcNow.AddHours(1),
                claims: claims,
                signingCredentials: cred
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

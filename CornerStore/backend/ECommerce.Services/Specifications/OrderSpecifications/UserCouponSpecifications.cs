using ECommerce.Domain.Entities.OrderModule;

namespace ECommerce.Services.Specifications.OrderSpecifications;

internal class UserCouponsForEmailSpecification : BaseSpecifications<UserCoupon, Guid>
{
    public UserCouponsForEmailSpecification(string email)
        : base(c => c.UserEmail == email) { }
}

internal class UserCouponByCodeSpecification : BaseSpecifications<UserCoupon, Guid>
{
    public UserCouponByCodeSpecification(string email, string code)
        : base(c => c.UserEmail == email && c.Code == code) { }
}

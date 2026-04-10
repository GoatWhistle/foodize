import pytest
from factories import make_user

from shared.dependencies.roles import RoleChecker
from shared.enums.roles import UserRole
from shared.exceptions.rules import RuleException


class TestRoleChecker:
    def test_allowed_role_returns_user(self):
        checker = RoleChecker(allowed_roles=[UserRole.CUSTOMER])
        user = make_user(user_role=UserRole.CUSTOMER)
        result = checker(user=user)
        assert result is user

    def test_denied_role_raises_rule_exception(self):
        checker = RoleChecker(allowed_roles=[UserRole.ADMIN])
        user = make_user(user_role=UserRole.CUSTOMER)
        with pytest.raises(RuleException):
            checker(user=user)

    def test_multiple_allowed_roles(self):
        checker = RoleChecker(allowed_roles=[UserRole.ADMIN, UserRole.VENDOR])
        vendor = make_user(user_role=UserRole.VENDOR)
        admin = make_user(user_role=UserRole.ADMIN)
        assert checker(user=vendor) is vendor
        assert checker(user=admin) is admin

    def test_customer_denied_when_vendor_required(self):
        checker = RoleChecker(allowed_roles=[UserRole.VENDOR])
        user = make_user(user_role=UserRole.CUSTOMER)
        with pytest.raises(RuleException):
            checker(user=user)

    def test_rule_exception_has_403_status(self):
        checker = RoleChecker(allowed_roles=[UserRole.ADMIN])
        user = make_user(user_role=UserRole.CUSTOMER)
        with pytest.raises(RuleException) as exc_info:
            checker(user=user)
        assert exc_info.value.status_code == 403

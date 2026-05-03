import pytest
from factories import make_user

from shared.dependencies.permissions import PermissionChecker
from shared.enums.permissions import Permission
from shared.enums.roles import UserRole
from shared.exceptions.rules import RuleException
from shared.permissions import get_permissions_for_role, has_permission


class TestRolePermissions:
    def test_admin_has_every_permission(self):
        admin_permissions = get_permissions_for_role(UserRole.ADMIN)

        assert admin_permissions == frozenset(Permission)

    def test_vendor_can_manage_menu_but_customer_cannot(self):
        assert has_permission(UserRole.VENDOR, Permission.MENU_MANAGE)
        assert not has_permission(UserRole.CUSTOMER, Permission.MENU_MANAGE)

    def test_staff_can_manage_order_status_but_cannot_manage_menu(self):
        assert has_permission(UserRole.STAFF, Permission.ORDERS_MANAGE_STATUS)
        assert not has_permission(UserRole.STAFF, Permission.MENU_MANAGE)

    def test_unknown_role_has_no_permissions(self):
        assert get_permissions_for_role("UNKNOWN") == frozenset()


class TestPermissionChecker:
    def test_all_required_permissions_returns_user(self):
        checker = PermissionChecker(
            required_permissions=[
                Permission.RESTAURANTS_READ,
                Permission.ORDERS_CREATE,
            ]
        )
        user = make_user(user_role=UserRole.CUSTOMER)

        assert checker(user=user) is user

    def test_missing_permission_raises_rule_exception(self):
        checker = PermissionChecker(required_permissions=[Permission.MENU_MANAGE])
        user = make_user(user_role=UserRole.CUSTOMER)

        with pytest.raises(RuleException):
            checker(user=user)

    def test_rule_exception_has_403_status(self):
        checker = PermissionChecker(required_permissions=[Permission.ADMIN_ACCESS])
        user = make_user(user_role=UserRole.CUSTOMER)

        with pytest.raises(RuleException) as exc_info:
            checker(user=user)

        assert exc_info.value.status_code == 403

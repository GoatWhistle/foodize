import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.users.models import User
from features.vendors.models import VendorProfile
from shared.enums.moderation_status import ModerationStatus
from shared.enums.permissions import Permission
from shared.permissions import (
    VENDOR_PERMISSIONS,
    has_permission,
    permissions_with,
    permissions_without,
)


async def get_all_vendors(
    session: AsyncSession,
    search: str | None = None,
    approval_status: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[VendorProfile]:
    stmt = (
        select(VendorProfile)
        .join(User, User.id == VendorProfile.user_id)
        .options(selectinload(VendorProfile.user), selectinload(VendorProfile.restaurants))
        .order_by(VendorProfile.created_at.desc())
    )
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where((User.name.ilike(pattern)) | (User.phone_number.ilike(pattern)))
    if approval_status:
        stmt = stmt.where(VendorProfile.approval_status == approval_status)
    result = await session.execute(stmt.offset(offset).limit(limit))
    return list(result.scalars().all())


async def count_all_vendors(
    session: AsyncSession,
    search: str | None = None,
    approval_status: str | None = None,
) -> int:
    stmt = (
        select(func.count()).select_from(VendorProfile).join(User, User.id == VendorProfile.user_id)
    )
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where((User.name.ilike(pattern)) | (User.phone_number.ilike(pattern)))
    if approval_status:
        stmt = stmt.where(VendorProfile.approval_status == approval_status)
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_vendor_by_id(session: AsyncSession, vendor_id: uuid.UUID) -> VendorProfile | None:
    result = await session.execute(
        select(VendorProfile)
        .join(User, User.id == VendorProfile.user_id)
        .where(VendorProfile.id == vendor_id)
        .options(selectinload(VendorProfile.user), selectinload(VendorProfile.restaurants))
    )
    return result.scalar_one_or_none()


async def deactivate_vendor(session: AsyncSession, vendor: VendorProfile) -> VendorProfile:
    if not has_permission(vendor.user.permissions, Permission.ADMIN_ACCESS):
        vendor.user.permissions = permissions_without(vendor.user.permissions, VENDOR_PERMISSIONS)
    for restaurant in vendor.restaurants or []:
        restaurant.is_active = False
        restaurant.is_open = False
        restaurant.is_hiring = False
    await session.flush()
    await session.refresh(vendor)
    return vendor


async def set_vendor_moderation(
    session: AsyncSession,
    vendor: VendorProfile,
    status: str,
    reason: str | None = None,
) -> VendorProfile:
    vendor.approval_status = status
    vendor.rejection_reason = reason if status == ModerationStatus.REJECTED.value else None
    if status == ModerationStatus.APPROVED.value:
        if not has_permission(vendor.user.permissions, Permission.ADMIN_ACCESS):
            vendor.user.permissions = permissions_with(vendor.user.permissions, VENDOR_PERMISSIONS)
        for restaurant in vendor.restaurants or []:
            restaurant.moderation_status = ModerationStatus.APPROVED.value
            restaurant.rejection_reason = None
    await session.flush()
    await session.refresh(vendor)
    return vendor

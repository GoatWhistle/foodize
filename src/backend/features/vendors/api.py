import uuid
from datetime import date
from http import HTTPStatus

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin.schemas import AdvancedAnalytics, FinanceAnalytics
from features.users.models import User
from features.vendors import export as vendor_export
from features.vendors import service
from features.vendors.dependencies import get_current_vendor
from features.vendors.exceptions import UnknownOrderStatusException
from features.vendors.models import VendorProfile
from features.vendors.schemas import VendorResponse
from settings.config.app_config import settings
from shared.dependencies import (
    ensure_restaurant_belongs_to_vendor,
    get_language,
    require_permission,
)
from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission
from shared.response import build_response
from shared.schemas.response import SuccessResponse

router = APIRouter(prefix=settings.api.v1.vendors.prefix, tags=[settings.api.v1.vendors.tag])

_CSV_MEDIA_TYPE = "text/csv"
_PDF_MEDIA_TYPE = "application/pdf"


def _file_response(data: bytes | str, media_type: str, filename: str) -> Response:
    return Response(
        content=data,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def _parse_order_status(status: str | None) -> OrderStatus | None:
    if not status:
        return None
    try:
        return OrderStatus(status)
    except ValueError as exc:
        raise UnknownOrderStatusException(status=status) from exc


@router.post(
    "/",
    response_model=SuccessResponse[VendorResponse],
    status_code=HTTPStatus.CREATED,
)
async def create_vendor(
    user: User = Depends(require_permission(Permission.VENDORS_CREATE)),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[VendorResponse]:
    result = await service.register_vendor(user=user, session=session)
    return build_response(result)


@router.get("/", response_model=SuccessResponse[VendorResponse])
async def read_my_vendor_profile(
    current_vendor: VendorProfile = Depends(get_current_vendor),
) -> SuccessResponse[VendorResponse]:
    return build_response(VendorResponse.model_validate(current_vendor))


@router.get("/finance", response_model=SuccessResponse[FinanceAnalytics])
async def read_vendor_finance(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    _user: User = Depends(require_permission(Permission.VENDORS_ANALYTICS_READ)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[FinanceAnalytics]:
    ensure_restaurant_belongs_to_vendor(current_vendor, restaurant_id)
    result = await service.get_vendor_finance(
        session=session,
        vendor=current_vendor,
        date_from=date_from,
        date_to=date_to,
        restaurant_id=restaurant_id,
    )
    return build_response(result)


@router.get("/analytics", response_model=SuccessResponse[AdvancedAnalytics])
async def read_vendor_analytics(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    _user: User = Depends(require_permission(Permission.VENDORS_ANALYTICS_READ)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdvancedAnalytics]:
    ensure_restaurant_belongs_to_vendor(current_vendor, restaurant_id)
    result = await service.get_vendor_analytics(
        session=session,
        vendor=current_vendor,
        date_from=date_from,
        date_to=date_to,
        restaurant_id=restaurant_id,
    )
    return build_response(result)


@router.get("/export/orders.csv")
async def export_orders_csv(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    status: str | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    _user: User = Depends(require_permission(Permission.VENDORS_ANALYTICS_READ)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    language: str = Depends(get_language),
) -> Response:
    data = await vendor_export.export_orders_csv(
        session,
        vendor=current_vendor,
        date_from=date_from,
        date_to=date_to,
        status=_parse_order_status(status),
        restaurant_id=restaurant_id,
        language=language,
    )
    return _file_response(data, _CSV_MEDIA_TYPE, "orders.csv")


@router.get("/export/menu.csv")
async def export_menu_csv(
    restaurant_id: uuid.UUID | None = Query(None),
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    language: str = Depends(get_language),
) -> Response:
    data = await vendor_export.export_menu_csv(
        session, vendor=current_vendor, restaurant_id=restaurant_id, language=language
    )
    return _file_response(data, _CSV_MEDIA_TYPE, "menu.csv")


@router.get("/export/promos.csv")
async def export_promos_csv(
    restaurant_id: uuid.UUID | None = Query(None),
    _user: User = Depends(require_permission(Permission.PROMOS_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    language: str = Depends(get_language),
) -> Response:
    data = await vendor_export.export_promos_csv(
        session, vendor=current_vendor, restaurant_id=restaurant_id, language=language
    )
    return _file_response(data, _CSV_MEDIA_TYPE, "promos.csv")


@router.get("/export/finance.pdf")
async def export_finance_pdf(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    _user: User = Depends(require_permission(Permission.VENDORS_ANALYTICS_READ)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    language: str = Depends(get_language),
) -> Response:
    data = await vendor_export.export_finance_pdf(
        session,
        vendor=current_vendor,
        date_from=date_from,
        date_to=date_to,
        restaurant_id=restaurant_id,
        language=language,
    )
    return _file_response(data, _PDF_MEDIA_TYPE, "finance.pdf")


@router.get("/export/analytics.pdf")
async def export_analytics_pdf(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    _user: User = Depends(require_permission(Permission.VENDORS_ANALYTICS_READ)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    language: str = Depends(get_language),
) -> Response:
    data = await vendor_export.export_analytics_pdf(
        session,
        vendor=current_vendor,
        date_from=date_from,
        date_to=date_to,
        restaurant_id=restaurant_id,
        language=language,
    )
    return _file_response(data, _PDF_MEDIA_TYPE, "analytics.pdf")

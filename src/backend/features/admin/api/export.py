import contextlib
from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin import export as admin_export
from features.admin.dependencies import require_admin
from features.users.models import User
from shared.enums.order_status import OrderStatus

router = APIRouter()

_CSV_MEDIA_TYPE = "text/csv"
_PDF_MEDIA_TYPE = "application/pdf"


def _attachment_response(content: bytes, media_type: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/users.csv")
async def export_users_csv(
    date_from: date | None = None,
    date_to: date | None = None,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Response:
    csv_bytes = await admin_export.export_users_csv(session, date_from=date_from, date_to=date_to)
    return _attachment_response(csv_bytes, _CSV_MEDIA_TYPE, "users.csv")


@router.get("/export/orders.csv")
async def export_orders_csv(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    status: str | None = Query(None),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Response:
    order_status = None
    if status:
        with contextlib.suppress(ValueError):
            order_status = OrderStatus(status)
    csv_bytes = await admin_export.export_orders_csv(
        session, date_from=date_from, date_to=date_to, status=order_status
    )
    return _attachment_response(csv_bytes, _CSV_MEDIA_TYPE, "orders.csv")


@router.get("/export/restaurants.csv")
async def export_restaurants_csv(
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Response:
    csv_bytes = await admin_export.export_restaurants_csv(session)
    return _attachment_response(csv_bytes, _CSV_MEDIA_TYPE, "restaurants.csv")


@router.get("/export/vendors.csv")
async def export_vendors_csv(
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Response:
    csv_bytes = await admin_export.export_vendors_csv(session)
    return _attachment_response(csv_bytes, _CSV_MEDIA_TYPE, "vendors.csv")


@router.get("/export/reviews.csv")
async def export_reviews_csv(
    min_rating: int | None = Query(None),
    max_rating: int | None = Query(None),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Response:
    csv_bytes = await admin_export.export_reviews_csv(
        session, min_rating=min_rating, max_rating=max_rating
    )
    return _attachment_response(csv_bytes, _CSV_MEDIA_TYPE, "reviews.csv")


@router.get("/export/finance.pdf")
async def export_finance_pdf(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Response:
    pdf_bytes = await admin_export.export_finance_pdf(session, date_from=date_from, date_to=date_to)
    return _attachment_response(pdf_bytes, _PDF_MEDIA_TYPE, "finance.pdf")


@router.get("/export/analytics.pdf")
async def export_analytics_pdf(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Response:
    pdf_bytes = await admin_export.export_analytics_pdf(
        session, date_from=date_from, date_to=date_to
    )
    return _attachment_response(pdf_bytes, _PDF_MEDIA_TYPE, "analytics.pdf")


@router.get("/export/overview.pdf")
async def export_overview_pdf(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Response:
    pdf_bytes = await admin_export.export_overview_pdf(
        session, date_from=date_from, date_to=date_to
    )
    return _attachment_response(pdf_bytes, _PDF_MEDIA_TYPE, "overview.pdf")

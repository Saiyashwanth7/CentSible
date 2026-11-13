from fastapi import APIRouter, File, Query, UploadFile, status, Request, HTTPException

from app.enums.receipt import Status
from app.routers.dependencies import CurrentUser, SessionDep
from app.schema.expense import ExpenseCreate, ExpenseResponse
from app.schema.receipt import ReceiptResponse, ReceiptUrlResponse
from app.services import receipt_services, rate_limit_services
from app.exceptions.receipt import GuestUploadNotAllowed
from app.utils.logging import Logger, LogLevel
from app.celery.tasks.receipt_tasks import task_process_receipt

router = APIRouter()


@router.get(
    "/receipt", status_code=status.HTTP_200_OK, response_model=list[ReceiptResponse]
)
async def get_receipts(
    user: CurrentUser,
    session: SessionDep,
    status_filter: Status | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return await receipt_services.list_receipts(
        user.id, session, status_filter, limit, offset
    )


@router.post(
    "/receipt", status_code=status.HTTP_201_CREATED, response_model=ReceiptResponse
)
async def receipt_import(
    request: Request,
    session: SessionDep,
    user: CurrentUser,
    file: UploadFile = File(...),
):

    if user.is_guest:
        raise GuestUploadNotAllowed
    id = user.id
    ip = request.client.host
    ip_key = f"rate:receipt:ip:{ip}"
    id_key = f"rate:receipt:id:{id}"
    ip_ok = await rate_limit_services.check_rate_limit(ip_key, 20, 60)
    id_ok = await rate_limit_services.check_rate_limit(id_key, 20, 3600)
    if not ip_ok or not id_ok:
        raise HTTPException(
            status_code=429,
            detail="Too many receipt upload attempts, please try again later",
        )

    receipt = await receipt_services.create_receipt(file, user.id, session)
    await session.commit()  # the worker must see the row, so commit before queueing
    try:
        task_process_receipt.delay(receipt.id)
    except Exception:
        Logger.log(LogLevel.ERROR, f"Could not queue receipt {receipt.id}")
    return receipt


@router.get("/receipt/{receipt_id}/url", response_model=ReceiptUrlResponse)
async def get_receipt_image_url(
    receipt_id: int, user: CurrentUser, session: SessionDep
):
    url = await receipt_services.get_receipt_image_url(receipt_id, user.id, session)
    return ReceiptUrlResponse(url=url)


@router.get(
    "/receipt/{receipt_id}",
    status_code=status.HTTP_200_OK,
    response_model=ReceiptResponse,
)
async def read_receipt(receipt_id: int, session: SessionDep, user: CurrentUser):
    return await receipt_services.get_receipt_by_id(receipt_id, user.id, session)


@router.post(
    "/receipt/{receipt_id}/confirm",
    status_code=status.HTTP_201_CREATED,
    response_model=ExpenseResponse,
)
async def confirm_receipt(
    receipt_id: int, user: CurrentUser, expense_data: ExpenseCreate, session: SessionDep
):
    return await receipt_services.confirm_receipt(
        receipt_id, user.id, expense_data, session
    )


@router.delete("/receipt/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(receipt_id: int, session: SessionDep, user: CurrentUser):
    await receipt_services.delete_receipt_by_id(receipt_id, user.id, session)

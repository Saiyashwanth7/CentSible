from functools import lru_cache
from typing import BinaryIO

import boto3
from botocore.config import Config

from app.core.config import settings


@lru_cache
def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.bucket_endpoint_url,
        region_name=settings.bucket_region or "auto",
        aws_access_key_id=settings.bucket_access_key_id,
        aws_secret_access_key=settings.bucket_secret_key,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


def upload_receipt(fileobj: BinaryIO, key: str, content_type: str) -> None:
    _client().upload_fileobj(
        fileobj, settings.bucket_name, key, ExtraArgs={"ContentType": content_type}
    )


def delete_receipt(key: str) -> None:
    _client().delete_object(Bucket=settings.bucket_name, Key=key)


def get_receipt_url(key: str, expires: int = 300) -> str:
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.bucket_name, "Key": key},
        ExpiresIn=expires,
    )


def download_receipt(key: str) -> tuple[bytes, str]:
    obj = _client().get_object(Bucket=settings.bucket_name, Key=key)
    return obj["Body"].read(), obj["ContentType"]

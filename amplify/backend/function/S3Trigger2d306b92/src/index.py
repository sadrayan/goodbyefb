
import boto3
import os
import json
import zipfile
from urllib.parse import unquote_plus

from concurrent import futures
from io import BytesIO


# s3 = boto3.client('s3')
s3_resource = boto3.resource('s3')
lam = boto3.client('lambda')

# https://github.com/mehmetboraezer/aws-lambda-unzip

def handler(event, context):
    # Parse and prepare required items from event
    global bucket, path, zipdata
    event = next(iter(event['Records']))
    bucket = event['s3']['bucket']['name']
    key = unquote_plus(event['s3']['object']['key']) 
    path = os.path.dirname(key)[:-3] + 'extract/'
    print(
      'event', event,
      'bucket', bucket,
      'key', key,
      'path', path
    )

    zip_obj = s3_resource.Object(bucket_name=bucket, key=key)
    buffer = BytesIO(zip_obj.get()["Body"].read())

    z = zipfile.ZipFile(buffer)
    for filename in z.namelist():
        file_info = z.getinfo(filename)
        s3_resource.meta.client.upload_fileobj(
            z.open(filename),
            Bucket=bucket,
            Key=os.path.join(path, filename)
        )

    eventParam = {}
    eventParam['bucket'] = bucket,
    eventParam['key'] = key,
    eventParam['path'] = path      

    print("unzipped successfuly")   

    lam.invoke(FunctionName='enrichFunction-' + os.getenv('ENV'),
                InvocationType='Event',
                Payload=json.dumps(eventParam))

    result = {'success': [], 'fail': []}

    return result
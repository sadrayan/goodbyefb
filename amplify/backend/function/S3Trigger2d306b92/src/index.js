const S3Unzip = require('s3-unzip') 

exports.handler = function(event, context, callback) { 
  console.log('Received S3 event:', JSON.stringify(event, null, 2))
  const bucketname = event.Records[0].s3.bucket.name
  const filename = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '))
  if (!filename.includes("zip"))
    return
  console.log(`Bucket: ${bucketname}`, `Key: ${filename}`)
  console.log(event.Records)

	new S3Unzip({ 
		bucket: bucketname, 
		file: filename, 
	 	verbose: true, 
 	}, function(err, success) { 
		if (err) { 
      console.log(err)
      callback(err) 
		} else { 
      console.log(success)
      context.done(null, 'Successfully processed S3 event')   
      callback(null) 
		} 
 	}) 
} 
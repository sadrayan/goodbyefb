var AWS = require('aws-sdk');
AWS.config.update({region: process.env.REGION});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

const docClient = new AWS.DynamoDB.DocumentClient()
const { v4: uuidv4 } = require('uuid')

const ddbTable = process.env.DDBtable 

exports.handler = async (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event, null, 2)}`);
  console.log('Using DDB table: ', ddbTable)

  var params = {
    Bucket: event['bucket'][0],
    Delimiter: '/',
    Prefix: event['path']
  };

  console.log(params)
    
  // s3.listObjects(params, function(err, data) {
  //             if (err) {
  //                 console.error(err.message)
  //                 return 'There was an error viewing your album: ' + err.message
  //             } else {
  //                 console.log(data.Contents,"<<<all content");
  
  //                 data.Contents.forEach(function(obj, index){
  //                     console.log(obj.Key,"<<<file path")
  //                 })
  //             }
  //         })


      // Get original text from object in incoming event
      const originalText = await s3.getObject({
        Bucket: params.Bucket,
        Key: params.Prefix + 'photos_and_videos/album/0.json',
      }).promise()

      // Upload JSON to DynamoDB
      const jsonData = JSON.parse(originalText.Body.toString('utf-8'))
      console.log(jsonData)
  
  // await Promise.all(
  //   event.Records.map(async (record) => {
  //     try {
  //       console.log('Incoming record: ', record)

  //       // Get original text from object in incoming event
  //       const originalText = await s3.getObject({
  //         Bucket: event.Records[0].s3.bucket.name,
  //         Key: event.Records[0].s3.object.key
  //       }).promise()

  //       // Upload JSON to DynamoDB
  //       const jsonData = JSON.parse(originalText.Body.toString('utf-8'))
  //       await ddbLoader(jsonData)

  //     } catch (err) {
  //       console.error(err)
  //     }
  //   })
  // )

};



// Load JSON data to DynamoDB table
const ddbLoader = async (data) => {
  // Separate into batches for upload
  let batches = []
  const BATCH_SIZE = 25

  while (data.length > 0) {
    batches.push(data.splice(0, BATCH_SIZE))
  }

  console.log(`Total batches: ${batches.length}`)

  let batchCount = 0

  // Save each batch
  await Promise.all(
    batches.map(async (item_data) => {

      // Set up the params object for the DDB call
      const params = {
        RequestItems: {}
      }
      params.RequestItems[ddbTable] = []
  
      item_data.forEach(item => {
        for (let key of Object.keys(item)) {
          // An AttributeValue may not contain an empty string
          if (item[key] === '') 
            delete item[key]
        }

        // Build params
        params.RequestItems[ddbTable].push({
          PutRequest: {
            Item: {
              ID: uuidv4(),
              ...item
            }
          }
        })
      })

      // Push to DynamoDB in batches
      try {
        batchCount++
        console.log('Trying batch: ', batchCount)
        const result = await docClient.batchWrite(params).promise()
        console.log('Success: ', result)
      } catch (err) {
        console.error('Error: ', err)
      }
    })
  )
}
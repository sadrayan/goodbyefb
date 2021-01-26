import React, { useState } from 'react';
import './App.css';

import Amplify, { Auth, Storage } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import awsconfig from './aws-exports';
Amplify.configure(awsconfig);

const App = () => {
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const downloadUrl = async () => {
    // const downloadUrl = await Storage.get('picture.jpg', { expires: 300 });
    window.location.href = fileUrl
  }

  const handleChange = async (e) => {
    const file = e.target.files[0];
    
    Auth.currentUserInfo()
      .then(data => console.log(data))
      .catch(err => console.log(err));

    console.log(file)

    try {
      setLoading(true);
      // Upload the file to s3 with private access level. 
      await Storage.put(`zip/${file.name}`, file, {
        level: 'protected',
        contentType: 'application/zip'
      });
      // Retrieve the uploaded file to display
      const url = await Storage.get(file, { level: 'protected', expires: 300 })
      console.log(file, url)
      setFileUrl(url);
      setLoading(false);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="App">
      <h1> Upload an Image </h1>
      {loading ? <h3>Uploading...</h3> : <input
        type="file" accept='application/zip'
        onChange={(evt) => handleChange(evt)}
      />}
      <div>
        <h2>Download URL?</h2>
        <button onClick={() => downloadUrl()}>Click Here!</button>
      </div>
    </div>
  );
}

export default withAuthenticator(App);


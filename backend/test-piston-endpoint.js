const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'python',
      version: '3.10.0',
      files: [{ content: 'print("hello")' }]
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error status:', err.response?.status);
    console.error('Error data:', err.response?.data);
    console.error('Error message:', err.message);
  }
})();

function auth(req, res, next) {
  const userIdHeader = req.headers['x-user-id'];

  if (!userIdHeader) {
    return res.status(401).json({ error: 'User ID header missing' });
  }

  const id = Number(userIdHeader);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  req.user = { id };
  next();
}

module.exports = auth;
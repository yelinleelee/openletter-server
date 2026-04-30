module.exports = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: '유효성 검사 오류',
      details: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: '중복된 값입니다',
      details: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }
  
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(400).json({
      error: '데이터베이스 오류가 발생했습니다'
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || '서버 오류가 발생했습니다'
  });
};
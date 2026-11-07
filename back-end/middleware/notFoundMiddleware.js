'use strict';

function notFoundMiddleware(req, res, next) {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({
            status: 'error',
            message: 'Endpoint API tidak ditemukan.'
        });
    }
    return res.status(404).sendFile(require('path').join(__dirname, '../../front-end/pages/404.html'), err => {
        if (err && !res.headersSent) res.status(404).send('Halaman tidak ditemukan.');
    });
}

module.exports = notFoundMiddleware;
